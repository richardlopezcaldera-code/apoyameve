-- ============================================================================
--  MIGRACIÓN — traspasar los datos de un "Cotizador v30" (tablas kam_*) al
--  nuevo modelo multiempresa. Convierte esa empresa en UN tenant más.
--
--  Cómo se usa (la v30 vive en OTRO proyecto Supabase):
--    1) En el proyecto viejo: exporta a CSV las tablas kam_clientes,
--       kam_productos, kam_proveedores, kam_cotizaciones
--       (Table Editor → ⋯ → Export to CSV).
--    2) En el proyecto NUEVO crea tablas de staging e importa esos CSV
--       (Table Editor → New table → Import data from CSV), con estos nombres:
--         stg_kam_clientes, stg_kam_productos, stg_kam_proveedores, stg_kam_cotizaciones
--       (deja las columnas tal cual vienen del CSV: id, nombre, rut, ...).
--    3) Ejecuta este script. Mapea todo a la empresa indicada en :slug_destino.
--
--  Requisitos: 01_schema_multiempresa.sql ya ejecutado y la empresa destino
--  creada (por 02_seed_demo.sql o por el onboarding). Ajusta el slug abajo.
-- ============================================================================

do $$
declare
  v_empresa uuid;
  slug_destino text := 'kamiana';   -- << AJUSTA al slug de la empresa destino
begin
  select id into v_empresa from empresas where slug = slug_destino;
  if v_empresa is null then
    raise exception 'No existe empresa con slug %. Créala antes de migrar.', slug_destino;
  end if;

  -- 1) Clientes ------------------------------------------------------------
  insert into clientes (empresa_id, nombre, rut, direccion, telefono, email, giro, legacy_id)
  select v_empresa, s.nombre, s.rut, s.direccion, s.telefono, s.email, s.giro, s.id::text
  from stg_kam_clientes s
  where not exists (
    select 1 from clientes c where c.empresa_id = v_empresa and c.legacy_id = s.id::text);

  -- 2) Productos -----------------------------------------------------------
  insert into productos (empresa_id, nombre, sku, categoria, costo, precio, proveedor, imagen, deleted, legacy_id)
  select v_empresa, s.nombre, s.sku, s.categoria, s.costo, s.precio, s.proveedor, s.imagen,
         coalesce(s.deleted, false), s.id::text
  from stg_kam_productos s
  where not exists (
    select 1 from productos p where p.empresa_id = v_empresa and p.legacy_id = s.id::text);

  -- 3) Proveedores ---------------------------------------------------------
  insert into proveedores (empresa_id, nombre, rut, contacto, telefono, email, legacy_id)
  select v_empresa, s.nombre, s.rut, s.contacto, s.telefono, s.email, s.id::text
  from stg_kam_proveedores s
  where not exists (
    select 1 from proveedores pr where pr.empresa_id = v_empresa and pr.legacy_id = s.id::text);

  -- 4) Cotizaciones (re-liga cliente_id vía legacy_id) ---------------------
  insert into cotizaciones (empresa_id, numero, fecha, cliente_id, vendedor_name,
                            items, despacho, pct, obs, estado, oc_numero, aprobada_fecha,
                            data, legacy_id)
  select v_empresa,
         s.numero,
         nullif(s.fecha,'')::date,
         cl.id,                                  -- cliente nuevo por legacy_id
         s.vendedor_name,
         s.items, s.despacho, s.pct, s.obs,
         coalesce(nullif(s.estado,''),'pendiente'),
         s.oc_numero, nullif(s.aprobada_fecha,'')::date,
         s.data, s.id::text
  from stg_kam_cotizaciones s
  left join clientes cl on cl.empresa_id = v_empresa and cl.legacy_id = s.cliente_id::text
  where not exists (
    select 1 from cotizaciones c where c.empresa_id = v_empresa and c.legacy_id = s.id::text);

  -- 5) Ajusta el contador de numeración al máximo migrado -------------------
  insert into contadores (empresa_id, tipo, ultimo)
  select v_empresa, 'cotizacion',
         coalesce(max( (regexp_replace(numero, '\D', '', 'g'))::int ), 0)
  from cotizaciones where empresa_id = v_empresa and numero ~ '\d'
  on conflict (empresa_id, tipo) do update set ultimo = excluded.ultimo;

  raise notice 'Migración completada para empresa % (%).', slug_destino, v_empresa;
end $$;

-- Limpieza opcional (cuando verifiques que todo migró bien):
--   drop table if exists stg_kam_clientes, stg_kam_productos,
--                        stg_kam_proveedores, stg_kam_cotizaciones;
