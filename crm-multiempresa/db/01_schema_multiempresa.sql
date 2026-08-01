-- ============================================================================
--  CRM MULTIEMPRESA — Esquema Supabase / PostgreSQL (multi-tenant)
--  Evolución enterprise del "Cotizador KAMIANA v30" (mono-empresa) hacia un
--  sistema donde MUCHAS empresas conviven en una sola base y un "holding"
--  (super admin) puede verlas todas.
--
--  Modelo de aislamiento: UNA sola base Supabase.
--    - Cada fila de negocio lleva `empresa_id`.
--    - Row Level Security (RLS) aísla los datos por empresa.
--    - Autenticación real vía Supabase Auth (auth.users) — ya NO se usan
--      contraseñas en texto plano en una tabla de usuarios.
--
--  Orden de ejecución en el SQL Editor de Supabase:
--    1) 01_schema_multiempresa.sql   (este archivo)
--    2) 02_seed_demo.sql             (opcional: datos de ejemplo)
--    3) 03_migracion_kam.sql         (opcional: importar datos de la v30)
--
--  Idempotente: usa `create table if not exists` / `create or replace`.
-- ============================================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ============================================================================
--  1. NÚCLEO MULTIEMPRESA (tenants, usuarios, membresías)
-- ============================================================================

-- Empresas = tenants. Cada cliente del CRM es una fila aquí.
create table if not exists empresas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  rut         text,
  slug        text unique,                       -- identificador corto / subdominio
  plan        text not null default 'basico',    -- basico | pro | enterprise
  estado      text not null default 'activa',    -- activa | prueba | suspendida
  logo_url    text,
  -- Configuración por empresa (reemplaza la vieja tabla kam_config):
  --   { "pct_venta":35, "iva":19, "moneda":"CLP",
  --     "apps_script_url":"https://.../exec", "ca_tel":"...", "ca_mail":"...",
  --     "firmas":[ {"nombre":"...","cargo":"...","tel":"..."} ] }
  config      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Perfiles: 1 fila por usuario de Supabase Auth (auth.users).
-- `es_super_admin` = staff de la plataforma / holding que ve TODAS las empresas.
create table if not exists perfiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  nombre         text,
  email          text,
  es_super_admin boolean not null default false,
  created_at     timestamptz not null default now()
);

-- Membresías: relación usuario ↔ empresa ↔ rol.
-- Un mismo usuario puede pertenecer a varias empresas con distinto rol.
create table if not exists membresias (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  usuario_id uuid not null references perfiles(id) on delete cascade,
  rol        text not null default 'vendedor',   -- admin_empresa | supervisor | vendedor | solo_lectura
  activo     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (empresa_id, usuario_id)
);
create index if not exists ix_membresias_usuario on membresias (usuario_id);
create index if not exists ix_membresias_empresa on membresias (empresa_id);

-- ============================================================================
--  2. FUNCIONES DE CONTEXTO (base de la seguridad multi-tenant)
--     SECURITY DEFINER para poder leer membresias sin recursión de RLS.
-- ============================================================================

create or replace function es_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select es_super_admin from perfiles where id = auth.uid()), false);
$$;

create or replace function empresas_de_usuario()
returns setof uuid language sql stable security definer set search_path = public as $$
  select empresa_id from membresias where usuario_id = auth.uid() and activo;
$$;

create or replace function tiene_acceso_empresa(p_empresa uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select es_super_admin() or exists (
    select 1 from membresias
    where usuario_id = auth.uid() and empresa_id = p_empresa and activo
  );
$$;

create or replace function rol_en_empresa(p_empresa uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when es_super_admin() then 'super_admin'
    else (select rol from membresias
          where usuario_id = auth.uid() and empresa_id = p_empresa and activo)
  end;
$$;

create or replace function es_admin_empresa(p_empresa uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select es_super_admin() or exists (
    select 1 from membresias
    where usuario_id = auth.uid() and empresa_id = p_empresa
      and activo and rol in ('admin_empresa','supervisor')
  );
$$;

grant execute on function es_super_admin(), empresas_de_usuario(),
  tiene_acceso_empresa(uuid), rol_en_empresa(uuid), es_admin_empresa(uuid)
  to anon, authenticated;

-- ============================================================================
--  3. TABLAS DE NEGOCIO (todas con empresa_id)
--     `legacy_id` guarda el id de texto original de la v30 para migrar sin perder
--     las referencias (ej. cotizaciones.cliente_id).
-- ============================================================================

create table if not exists clientes (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre     text not null,
  rut        text, direccion text, telefono text, email text, giro text,
  legacy_id  text,
  updated_at timestamptz not null default now()
);
create index if not exists ix_clientes_empresa on clientes (empresa_id);
create index if not exists ix_clientes_legacy  on clientes (empresa_id, legacy_id);

create table if not exists productos (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre     text, sku text, categoria text,
  costo      numeric, precio numeric,
  proveedor  text, imagen text,
  deleted    boolean not null default false,
  legacy_id  text,
  updated_at timestamptz not null default now()
);
create index if not exists ix_productos_empresa on productos (empresa_id);
create index if not exists ix_productos_legacy  on productos (empresa_id, legacy_id);

create table if not exists proveedores (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre     text, rut text, contacto text, telefono text, email text,
  legacy_id  text
);
create index if not exists ix_proveedores_empresa on proveedores (empresa_id);

create table if not exists cotizaciones (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references empresas(id) on delete cascade,
  numero         text,
  fecha          date default current_date,
  cliente_id     uuid references clientes(id) on delete set null,
  vendedor_id    uuid references perfiles(id) on delete set null,
  vendedor_name  text,
  items          jsonb,
  despacho       numeric,
  pct            numeric,
  obs            text,
  estado         text default 'pendiente',       -- pendiente | aprobada | rechazada
  oc_numero      text,
  aprobada_fecha date,
  data           jsonb,
  legacy_id      text,
  updated_at     timestamptz not null default now()
);
create index if not exists ix_cotiz_empresa        on cotizaciones (empresa_id);
create index if not exists ix_cotiz_empresa_estado on cotizaciones (empresa_id, estado);
create index if not exists ix_cotiz_empresa_fecha  on cotizaciones (empresa_id, fecha desc);

-- Bitácora / auditoría (quién hizo qué, en qué empresa).
create table if not exists auditoria (
  id         bigserial primary key,
  empresa_id uuid references empresas(id) on delete set null,
  usuario_id uuid,
  accion     text,        -- crear | editar | eliminar | aprobar | login ...
  entidad    text,        -- cliente | producto | cotizacion ...
  entidad_id text,
  detalle    jsonb,
  creado_at  timestamptz not null default now()
);
create index if not exists ix_auditoria_empresa on auditoria (empresa_id, creado_at desc);

-- ============================================================================
--  4. NUMERACIÓN POR EMPRESA (cada empresa numera desde su propio 1)
-- ============================================================================

create table if not exists contadores (
  empresa_id uuid not null references empresas(id) on delete cascade,
  tipo       text not null,             -- 'cotizacion' | 'oc' | 'nota'
  ultimo     integer not null default 0,
  primary key (empresa_id, tipo)
);

create or replace function siguiente_numero(
  p_empresa uuid, p_tipo text default 'cotizacion', p_prefijo text default 'COT')
returns text language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not tiene_acceso_empresa(p_empresa) then
    raise exception 'Sin acceso a la empresa %', p_empresa;
  end if;
  insert into contadores(empresa_id, tipo, ultimo) values (p_empresa, p_tipo, 1)
  on conflict (empresa_id, tipo) do update set ultimo = contadores.ultimo + 1
  returning ultimo into n;
  return p_prefijo || '-' || lpad(n::text, 5, '0');
end $$;
grant execute on function siguiente_numero(uuid, text, text) to authenticated;

-- ============================================================================
--  5. ALTA DE EMPRESA + PRIMER ADMIN (usada por el onboarding del holding)
--     Crea la empresa y da de alta al usuario (ya existente en Auth) como
--     admin_empresa. Devuelve el id de la empresa.
-- ============================================================================

create or replace function crear_empresa_con_admin(
  p_nombre text, p_admin_usuario uuid, p_rut text default null,
  p_slug text default null, p_plan text default 'basico')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_empresa uuid;
begin
  if not es_super_admin() then
    raise exception 'Solo un super admin puede crear empresas';
  end if;
  insert into empresas(nombre, rut, slug, plan)
    values (p_nombre, p_rut, p_slug, p_plan)
    returning id into v_empresa;
  insert into membresias(empresa_id, usuario_id, rol)
    values (v_empresa, p_admin_usuario, 'admin_empresa');
  return v_empresa;
end $$;
grant execute on function crear_empresa_con_admin(text, uuid, text, text, text) to authenticated;

-- ============================================================================
--  6. ROW LEVEL SECURITY
-- ============================================================================

-- --- 6.1 Tablas de negocio: acceso por membresía a la empresa ---------------
do $$
declare t text;
declare tbls text[] := array['clientes','productos','proveedores','cotizaciones','contadores','auditoria'];
begin
  foreach t in array tbls loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists sel_%1$s on %1$s;', t);
    execute format('drop policy if exists ins_%1$s on %1$s;', t);
    execute format('drop policy if exists upd_%1$s on %1$s;', t);
    execute format('drop policy if exists del_%1$s on %1$s;', t);
    execute format('create policy sel_%1$s on %1$s for select using (tiene_acceso_empresa(empresa_id));', t);
    execute format('create policy ins_%1$s on %1$s for insert with check (tiene_acceso_empresa(empresa_id));', t);
    execute format('create policy upd_%1$s on %1$s for update using (tiene_acceso_empresa(empresa_id)) with check (tiene_acceso_empresa(empresa_id));', t);
    execute format('create policy del_%1$s on %1$s for delete using (tiene_acceso_empresa(empresa_id));', t);
  end loop;
end $$;

-- --- 6.2 empresas: ves las tuyas; el super admin ve todas -------------------
alter table empresas enable row level security;
drop policy if exists sel_empresas on empresas;
drop policy if exists ins_empresas on empresas;
drop policy if exists upd_empresas on empresas;
drop policy if exists del_empresas on empresas;
create policy sel_empresas on empresas for select
  using (es_super_admin() or id in (select empresas_de_usuario()));
-- Alta/baja de empresas: sólo super admin (o vía crear_empresa_con_admin()).
create policy ins_empresas on empresas for insert with check (es_super_admin());
create policy del_empresas on empresas for delete using (es_super_admin());
-- Editar: super admin cualquiera; admin_empresa sólo la suya (logo, config...).
create policy upd_empresas on empresas for update
  using (es_admin_empresa(id)) with check (es_admin_empresa(id));

-- --- 6.3 perfiles: ves tu propio perfil; super admin ve todos ---------------
alter table perfiles enable row level security;
drop policy if exists sel_perfiles on perfiles;
drop policy if exists upd_perfiles on perfiles;
create policy sel_perfiles on perfiles for select
  using (es_super_admin() or id = auth.uid());
create policy upd_perfiles on perfiles for update
  using (id = auth.uid()) with check (id = auth.uid() and es_super_admin = (select es_super_admin from perfiles where id = auth.uid()));
-- Nota: la creación de perfiles se hace por trigger (6.5), no por el cliente.

-- --- 6.4 membresias: ves las tuyas; admin_empresa gestiona las de su empresa -
alter table membresias enable row level security;
drop policy if exists sel_membresias on membresias;
drop policy if exists ins_membresias on membresias;
drop policy if exists upd_membresias on membresias;
drop policy if exists del_membresias on membresias;
create policy sel_membresias on membresias for select
  using (es_super_admin() or usuario_id = auth.uid() or es_admin_empresa(empresa_id));
create policy ins_membresias on membresias for insert
  with check (es_admin_empresa(empresa_id));
create policy upd_membresias on membresias for update
  using (es_admin_empresa(empresa_id)) with check (es_admin_empresa(empresa_id));
create policy del_membresias on membresias for delete
  using (es_admin_empresa(empresa_id));

-- --- 6.5 Alta automática de perfil al registrarse en Auth -------------------
create or replace function _crear_perfil_nuevo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles(id, nombre, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', new.email), new.email)
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists trg_nuevo_usuario on auth.users;
create trigger trg_nuevo_usuario after insert on auth.users
  for each row execute function _crear_perfil_nuevo_usuario();

-- ============================================================================
--  7. VISTAS PARA EL PANEL "HOLDING" (consolidado multiempresa)
--     Respetan RLS: un admin_empresa sólo ve su fila; el super admin ve todo.
-- ============================================================================

-- Subconsultas por empresa (NO joins) para evitar fan-out en las sumas.
create or replace view v_resumen_empresas as
select
  e.id, e.nombre, e.plan, e.estado,
  (select count(*) from membresias  m  where m.empresa_id = e.id and m.activo)     as usuarios,
  (select count(*) from clientes    cl where cl.empresa_id = e.id)                 as clientes,
  (select count(*) from cotizaciones c where c.empresa_id = e.id)                  as cotizaciones,
  (select count(*) from cotizaciones c where c.empresa_id = e.id
     and c.estado = 'aprobada')                                                    as cotiz_aprobadas,
  -- 'total' puede venir con formato en datos migrados: extraemos solo dígitos.
  (select coalesce(sum(
      nullif(regexp_replace(coalesce(c.data->>'total',''), '[^0-9]', '', 'g'), '')::numeric
    ), 0)
   from cotizaciones c where c.empresa_id = e.id and c.estado = 'aprobada')        as ventas_aprobadas
from empresas e;

-- ============================================================================
--  FIN. Recuerda: marca al menos un perfil como super admin, p.ej.:
--    update perfiles set es_super_admin = true where email = 'tu-correo@dominio.com';
-- ============================================================================
