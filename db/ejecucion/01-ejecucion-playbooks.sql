-- ============================================================
-- PASO 1 · Capa de ejecución (modelo Vixiees) · crm-multiempresa
-- Playbooks + motor de tareas. NO toca tablas existentes.
-- Prefijo de todo: ejec_   ·   Rollback: 01-ejecucion-playbooks-ROLLBACK.sql
-- Requiere Postgres 15+ (Supabase ya lo es): usa NULLS NOT DISTINCT y
-- vistas con security_invoker.
-- Idempotente: se puede correr varias veces sin duplicar nada.
-- ============================================================

-- 1) Playbooks: el administrador diseña el proceso una vez
create table if not exists ejec_playbooks (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid,                      -- null = aplica a todas las empresas
  codigo      text not null,             -- ej. 'cotizacion_web'
  nombre      text not null,
  activo      boolean not null default true,
  creado_en   timestamptz not null default now(),
  -- NULLS NOT DISTINCT: sin esto, dos filas ('cotizacion_web', null) no chocan
  -- y la semilla se duplicaría en cada corrida.
  unique nulls not distinct (codigo, empresa_id)
);

-- 2) Pasos del playbook: orden fijo, canal, espera y plantilla
create table if not exists ejec_playbook_pasos (
  id              uuid primary key default gen_random_uuid(),
  playbook_id     uuid not null references ejec_playbooks(id) on delete cascade,
  orden           int  not null,
  nombre          text not null,
  canal           text not null check (canal in ('whatsapp','correo','llamada','tarea')),
  espera_minutos  int  not null default 0 check (espera_minutos >= 0),  -- desde que se cierra el paso anterior
  plantilla       text,                     -- mensaje prellenado; admite {nombre} y cualquier clave de datos ({empresa} {monto} {link}…)
  obligatorio     boolean not null default true,
  unique (playbook_id, orden)
);

-- 3) Tareas: lo que el vendedor ve. Una tarea = un lead + un paso
create table if not exists ejec_tareas (
  id                uuid primary key default gen_random_uuid(),
  playbook_id       uuid not null references ejec_playbooks(id),
  paso_id           uuid not null references ejec_playbook_pasos(id),
  empresa_id        uuid not null,
  vendedor_id       uuid,                   -- usuario del CRM
  entidad_tipo      text not null,          -- 'cotizacion' | 'lead' | 'compra_agil' | 'pedido' | 'cliente'
  entidad_id        text not null,          -- id en su tabla de origen (texto para no atarse a uuid/int)
  contacto_nombre   text,
  contacto_telefono text,
  contacto_email    text,
  datos             jsonb not null default '{}'::jsonb,  -- monto, link, etc. para la plantilla
  vence_en          timestamptz not null,
  estado            text not null default 'pendiente'
                    check (estado in ('pendiente','hecha','pospuesta','cancelada')),
  resultado         text
                    check (resultado is null or resultado in
                      ('contesto','no_contesto','pidio_cambio','compro','perdido','no_aplica')),
  nota              text,
  posposiciones     int not null default 0,
  creado_en         timestamptz not null default now(),
  cerrado_en        timestamptz
);
create index if not exists ejec_tareas_cola_idx
  on ejec_tareas (vendedor_id, estado, vence_en);
create index if not exists ejec_tareas_entidad_idx
  on ejec_tareas (entidad_tipo, entidad_id);
-- Garantiza (también con llamadas simultáneas) una sola tarea abierta
-- por playbook + entidad. ejec_iniciar se apoya en este índice.
create unique index if not exists ejec_tareas_una_abierta_idx
  on ejec_tareas (playbook_id, entidad_tipo, entidad_id)
  where estado in ('pendiente','pospuesta');

-- 4) Mensaje final por tarea: deja constancia de lo que se envió / dijo
create table if not exists ejec_contactos (
  id          uuid primary key default gen_random_uuid(),
  tarea_id    uuid not null references ejec_tareas(id) on delete cascade,
  canal       text not null,
  mensaje     text,
  creado_en   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- FUNCIONES
-- ------------------------------------------------------------

-- Fecha "de hoy" según la hora de Chile (Supabase corre en UTC; sin esto,
-- desde las 20/21 h las tareas de mañana contarían como "hoy").
create or replace function ejec_fecha_local(p_ts timestamptz default now())
returns date language sql stable as $$
  select (p_ts at time zone 'America/Santiago')::date;
$$;

-- Rellena {campo} de la plantilla con contacto + datos
create or replace function ejec_render(p_plantilla text, p_tarea ejec_tareas)
returns text language plpgsql stable as $$
declare
  k text; v text; out text := coalesce(p_plantilla,'');
begin
  out := replace(out, '{nombre}', coalesce(p_tarea.contacto_nombre,''));
  for k, v in select key, value #>> '{}' from jsonb_each(p_tarea.datos) loop
    out := replace(out, '{'||k||'}', coalesce(v,''));
  end loop;
  return out;
end $$;

-- Inicia un playbook sobre una entidad (crea la tarea del paso 1).
-- No duplica si ya hay un playbook abierto para esa misma entidad (devuelve null).
create or replace function ejec_iniciar(
  p_codigo        text,
  p_empresa_id    uuid,
  p_vendedor_id   uuid,
  p_entidad_tipo  text,
  p_entidad_id    text,
  p_nombre        text default null,
  p_telefono      text default null,
  p_email         text default null,
  p_datos         jsonb default '{}'::jsonb
) returns uuid language plpgsql as $$
declare
  v_pb   ejec_playbooks;
  v_paso ejec_playbook_pasos;
  v_id   uuid;
begin
  select * into v_pb from ejec_playbooks
   where codigo = p_codigo and activo
     and (empresa_id = p_empresa_id or empresa_id is null)
   order by empresa_id nulls last limit 1;
  if v_pb.id is null then
    raise exception 'Playbook % no existe o está inactivo', p_codigo;
  end if;

  select * into v_paso from ejec_playbook_pasos
   where playbook_id = v_pb.id order by orden limit 1;
  if v_paso.id is null then
    raise exception 'Playbook % no tiene pasos', p_codigo;
  end if;

  insert into ejec_tareas (playbook_id, paso_id, empresa_id, vendedor_id,
                           entidad_tipo, entidad_id, contacto_nombre, contacto_telefono,
                           contacto_email, datos, vence_en)
  values (v_pb.id, v_paso.id, p_empresa_id, p_vendedor_id,
          p_entidad_tipo, p_entidad_id, p_nombre, p_telefono, p_email,
          coalesce(p_datos, '{}'::jsonb),
          now() + make_interval(mins => v_paso.espera_minutos))
  on conflict (playbook_id, entidad_tipo, entidad_id)
     where estado in ('pendiente','pospuesta')
  do nothing                                  -- ya está en curso
  returning id into v_id;
  return v_id;
end $$;

-- El vendedor registra el resultado. El sistema decide el siguiente paso.
--   compro / perdido / no_aplica  -> cierra el playbook para esa entidad
--   cualquier otro                -> crea la tarea del paso siguiente
create or replace function ejec_registrar_resultado(
  p_tarea_id  uuid,
  p_resultado text,
  p_nota      text default null,
  p_mensaje   text default null
) returns uuid language plpgsql as $$
declare
  v_t    ejec_tareas;
  v_paso ejec_playbook_pasos;
  v_sig  ejec_playbook_pasos;
  v_id   uuid;
begin
  select * into v_t from ejec_tareas where id = p_tarea_id for update;
  if v_t.id is null then raise exception 'Tarea no existe'; end if;
  if v_t.estado not in ('pendiente','pospuesta') then
    raise exception 'La tarea ya está cerrada (%)', v_t.estado;
  end if;

  -- Conserva la nota de posposiciones anteriores en vez de pisarla
  update ejec_tareas
     set estado = 'hecha', resultado = p_resultado, cerrado_en = now(),
         nota = case
                  when nullif(p_nota,'') is null then nota
                  when nota is null or nota = '' then p_nota
                  else nota || ' | ' || p_nota
                end
   where id = p_tarea_id;

  select * into v_paso from ejec_playbook_pasos where id = v_t.paso_id;
  if p_mensaje is not null then
    insert into ejec_contactos (tarea_id, canal, mensaje) values (p_tarea_id, v_paso.canal, p_mensaje);
  end if;

  if p_resultado in ('compro','perdido','no_aplica') then
    return null;
  end if;

  select * into v_sig from ejec_playbook_pasos
   where playbook_id = v_t.playbook_id and orden > v_paso.orden
   order by orden limit 1;
  if v_sig.id is null then return null; end if;  -- fin del playbook

  insert into ejec_tareas (playbook_id, paso_id, empresa_id, vendedor_id,
                           entidad_tipo, entidad_id, contacto_nombre, contacto_telefono,
                           contacto_email, datos, vence_en)
  values (v_t.playbook_id, v_sig.id, v_t.empresa_id, v_t.vendedor_id,
          v_t.entidad_tipo, v_t.entidad_id, v_t.contacto_nombre, v_t.contacto_telefono,
          v_t.contacto_email, v_t.datos,
          now() + make_interval(mins => v_sig.espera_minutos))
  returning id into v_id;
  return v_id;
end $$;

-- Posponer: no se puede saltar, solo mover con motivo (queda contado).
-- Falla con error si no hay motivo, si los minutos no son > 0 o si la tarea ya está cerrada.
create or replace function ejec_posponer(p_tarea_id uuid, p_minutos int, p_motivo text)
returns void language plpgsql as $$
begin
  if nullif(trim(coalesce(p_motivo,'')),'') is null then
    raise exception 'Para posponer hay que indicar un motivo';
  end if;
  if coalesce(p_minutos,0) <= 0 then
    raise exception 'Los minutos para posponer deben ser mayores a 0';
  end if;

  update ejec_tareas
     set estado = 'pospuesta',
         vence_en = now() + make_interval(mins => p_minutos),
         nota = coalesce(nota,'') || case when nota is null or nota='' then '' else ' | ' end
                || 'Pospuesta: ' || p_motivo,
         posposiciones = posposiciones + 1
   where id = p_tarea_id and estado in ('pendiente','pospuesta');
  if not found then
    raise exception 'Tarea no existe o ya está cerrada';
  end if;
end $$;

-- Reasignar vendedor (admin)
create or replace function ejec_reasignar(p_tarea_id uuid, p_vendedor_id uuid)
returns void language plpgsql as $$
begin
  update ejec_tareas set vendedor_id = p_vendedor_id
   where id = p_tarea_id and estado in ('pendiente','pospuesta');
  if not found then
    raise exception 'Tarea no existe o ya está cerrada';
  end if;
end $$;

-- ------------------------------------------------------------
-- VISTAS (lo que lee la pantalla "Modo ejecución" y el supervisor)
-- security_invoker: las vistas respetan el RLS de quien consulta
-- (por defecto en Postgres una vista corre con los permisos de su dueño).
-- ------------------------------------------------------------

-- Cola completa con todo lo que necesita la pantalla
create or replace view ejec_cola with (security_invoker = true) as
select t.id, t.empresa_id, t.vendedor_id, t.entidad_tipo, t.entidad_id,
       t.contacto_nombre, t.contacto_telefono, t.contacto_email, t.datos,
       pb.codigo as playbook, pb.nombre as playbook_nombre,
       p.orden, p.nombre as paso, p.canal, p.obligatorio,
       ejec_render(p.plantilla, t) as mensaje,
       t.vence_en, t.estado, t.posposiciones,
       (t.vence_en < now()) as vencida,
       extract(epoch from (now() - t.vence_en))/3600 as horas_atraso
  from ejec_tareas t
  join ejec_playbooks pb on pb.id = t.playbook_id
  join ejec_playbook_pasos p on p.id = t.paso_id
 where t.estado in ('pendiente','pospuesta');

-- La siguiente tarea de cada vendedor (una sola fila por vendedor)
create or replace view ejec_siguiente with (security_invoker = true) as
select distinct on (vendedor_id) *
  from ejec_cola
 where vence_en <= now()
 order by vendedor_id, vence_en asc;

-- Supervisor: resumen por vendedor ("hoy" = día calendario en Chile)
create or replace view ejec_supervisor with (security_invoker = true) as
select v.vendedor_id, v.empresa_id,
       count(*) filter (where v.estado in ('pendiente','pospuesta') and v.vence_en < now())                          as vencidas,
       count(*) filter (where v.estado in ('pendiente','pospuesta') and ejec_fecha_local(v.vence_en) = ejec_fecha_local()) as hoy,
       count(*) filter (where v.estado = 'hecha' and ejec_fecha_local(v.cerrado_en) = ejec_fecha_local())           as hechas_hoy,
       count(*) filter (where v.resultado = 'contesto'  and v.cerrado_en > now() - interval '30 days')              as contactos_30d,
       count(*) filter (where v.resultado = 'compro'    and v.cerrado_en > now() - interval '30 days')              as ventas_30d,
       count(*) filter (where v.resultado = 'perdido'   and v.cerrado_en > now() - interval '30 days')              as perdidos_30d,
       coalesce(sum(v.posposiciones) filter (where v.cerrado_en > now() - interval '30 days'), 0)                   as posposiciones_30d
  from ejec_tareas v
 group by v.vendedor_id, v.empresa_id;

-- Conversión por paso (para el "cerebro de ventas" más adelante)
create or replace view ejec_conversion_pasos with (security_invoker = true) as
select pb.codigo as playbook, p.orden, p.nombre as paso, p.canal,
       count(*) filter (where t.estado='hecha')                 as hechas,
       count(*) filter (where t.resultado='contesto')           as contestaron,
       count(*) filter (where t.resultado='compro')             as compraron,
       round(100.0 * count(*) filter (where t.resultado='contesto')
             / nullif(count(*) filter (where t.estado='hecha'),0), 1) as pct_contacto
  from ejec_tareas t
  join ejec_playbooks pb on pb.id = t.playbook_id
  join ejec_playbook_pasos p on p.id = t.paso_id
 group by pb.codigo, p.orden, p.nombre, p.canal
 order by pb.codigo, p.orden;

-- ------------------------------------------------------------
-- RLS (Supabase expone toda tabla de `public` por la API REST)
-- Igual que las tablas kam_: RLS habilitado con políticas permisivas para
-- anon/authenticated, para que el Cotizador (anon key) pueda usarlas.
-- NOTA DE SEGURIDAD: "using (true)" deja estas tablas abiertas a cualquiera
-- con la anon key. Cuando el CRM tenga login, cambiá estas políticas para
-- filtrar por empresa_id / vendedor_id.
-- ------------------------------------------------------------
do $$
declare t text;
begin
  -- Solo si existen los roles de Supabase (así el script corre también en un Postgres local)
  if not exists (select 1 from pg_roles where rolname = 'anon') then return; end if;
  foreach t in array array['ejec_playbooks','ejec_playbook_pasos','ejec_tareas','ejec_contactos'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_acceso', t);
    execute format('create policy %I on %I for all to anon, authenticated using (true) with check (true)',
                   t || '_acceso', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- SEMILLA: playbook "Cotización web enviada" (todas las empresas)
-- ------------------------------------------------------------
insert into ejec_playbooks (empresa_id, codigo, nombre)
values (null, 'cotizacion_web', 'Cotización web enviada')
on conflict (codigo, empresa_id) do nothing;

insert into ejec_playbook_pasos (playbook_id, orden, nombre, canal, espera_minutos, plantilla)
select id, s.orden, s.nombre, s.canal, s.espera, s.plantilla
  from ejec_playbooks, (values
    (1, 'Confirmar recepción',      'whatsapp', 120,
     'Hola {nombre}, te escribo de {empresa}. Te enviamos la cotización por {monto}. ¿La recibiste bien? Cualquier duda me dices.'),
    (2, 'Llamada de seguimiento',   'llamada',  1440,
     'Preguntar: ¿revisaron la cotización? ¿Hay algo que ajustar (cantidad, modelo, plazo)?'),
    (3, 'Correo con alternativa',   'correo',   4320,
     'Hola {nombre}, te dejo una alternativa a la cotización anterior por si se ajusta mejor: {link}. Quedo atento.'),
    (4, 'Última oferta',            'whatsapp', 10080,
     'Hola {nombre}, cierro el seguimiento de la cotización {monto}. Si la retomas, te mantengo el precio hasta fin de mes. ¡Gracias!')
  ) as s(orden, nombre, canal, espera, plantilla)
 where codigo = 'cotizacion_web' and empresa_id is null
on conflict (playbook_id, orden) do nothing;

-- ------------------------------------------------------------
-- PRUEBA RÁPIDA: ver 01-ejecucion-playbooks.test.sql (corre todo dentro de
-- una transacción y hace ROLLBACK al final, no deja datos).
-- ------------------------------------------------------------
