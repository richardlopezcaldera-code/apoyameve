-- ============================================================
-- Esquema de la base compartida (Supabase / Postgres) — tablas kam_*
-- Compartida entre apoyameve y el Cotizador (crm-multiempresa).
--
-- Versión SANEADA: solo estructura. NO incluye usuarios/contraseñas sembradas
-- ni el identificador del proyecto real. Ejecutá esto en el SQL Editor de tu
-- proyecto Supabase. Las credenciales (URL + key) van como secrets, nunca acá.
-- ============================================================

create table if not exists kam_usuarios (
  usuario text primary key, pass text, role text, name text,
  updated_at timestamptz default now()
);
create table if not exists kam_clientes (
  id text primary key, nombre text, rut text, direccion text, telefono text,
  email text, giro text, updated_at timestamptz default now()
);
create table if not exists kam_productos (
  id text primary key, nombre text, sku text, categoria text, costo numeric,
  precio numeric, proveedor text, imagen text, deleted boolean default false,
  updated_at timestamptz default now()
);
create table if not exists kam_proveedores (
  id text primary key, nombre text, rut text, contacto text, telefono text, email text
);
create table if not exists kam_cotizaciones (
  id text primary key, numero text, fecha text, cliente_id text, vendedor text,
  vendedor_name text, items jsonb, despacho numeric, pct numeric, obs text,
  estado text, oc_numero text, aprobada_fecha text, data jsonb,
  updated_at timestamptz default now()
);
create table if not exists kam_config (key text primary key, value jsonb);

-- Numeración central de cotizaciones (COT-000X)
create sequence if not exists kam_cot_seq start 1;
create or replace function kam_next_cot() returns text language sql security definer as $$
  select 'COT-' || lpad(nextval('kam_cot_seq')::text, 4, '0');
$$;
grant execute on function kam_next_cot() to anon, authenticated;

-- RLS habilitado en todas las tablas.
-- NOTA DE SEGURIDAD: el Cotizador usa políticas permisivas al rol `anon`
-- (using true / with check true). Eso deja la base abierta a cualquiera con la
-- anon key. Si podés, restringí estas políticas y usá una key de servicio para
-- accesos server-side. apoyameve solo necesita LEER kam_productos.
alter table kam_usuarios enable row level security;
alter table kam_clientes enable row level security;
alter table kam_productos enable row level security;
alter table kam_proveedores enable row level security;
alter table kam_cotizaciones enable row level security;
alter table kam_config enable row level security;
