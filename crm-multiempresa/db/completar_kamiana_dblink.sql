-- ============================================================================
--  completar_kamiana_dblink.sql
--  Copia TODOS los datos reales desde PRODUCCION al proyecto de PRUEBA usando
--  dblink. Trae KAMIANA (kam_*) y MobiliarioTech (mtc_*) completos:
--  clientes, productos, proveedores y cotizaciones (incl. las 7,3 MB de KAMIANA).
--
--  DONDE EJECUTAR:  SQL Editor del proyecto de PRUEBA (crm-multiempresa /
--                   awdgvtfchubneruyqman).  NO en produccion.
--  SEGURIDAD:       dblink solo LEE produccion (SELECT). No la modifica.
--  IDEMPOTENTE:     inserta por legacy_id solo lo que falta; re-ejecutable.
--
--  PASO PREVIO — cadena de conexion a PRODUCCION:
--    1) En Supabase (proyecto de produccion, htjjxqvzxkrabozopxhe) ->
--       Settings -> Database. Copia la "Database password" (o resetéala; no
--       afecta tu cotizador, que usa la anon key).
--    2) Usa el host de "Connection pooling" (IPv4). Reemplaza PWD abajo.
--       user = postgres.htjjxqvzxkrabozopxhe   (¡con el ref del proyecto!)
-- ============================================================================

create extension if not exists dblink;

-- >>>>>>>>>> AJUSTA AQUI: pon tu contraseña real en lugar de PON_TU_PASSWORD <<<<<<<<<<
select dblink_connect(
  'src',
  'host=aws-0-us-east-1.pooler.supabase.com port=5432 dbname=postgres '
  'user=postgres.htjjxqvzxkrabozopxhe password=PON_TU_PASSWORD sslmode=require'
);

-- ============================================================================
--  KAMIANA  (empresa slug = 'kamiana')
-- ============================================================================

-- Clientes
insert into clientes (empresa_id,nombre,rut,direccion,telefono,email,giro,legacy_id)
select (select id from empresas where slug='kamiana'),
       t.nombre,t.rut,t.direccion,t.telefono,t.email,t.giro,t.id
from dblink('src','select id,nombre,rut,direccion,telefono,email,giro from kam_clientes')
  as t(id text,nombre text,rut text,direccion text,telefono text,email text,giro text)
where not exists (select 1 from clientes c
  where c.empresa_id=(select id from empresas where slug='kamiana') and c.legacy_id=t.id);

-- Proveedores
insert into proveedores (empresa_id,nombre,rut,contacto,telefono,email,legacy_id)
select (select id from empresas where slug='kamiana'),
       t.nombre,t.rut,t.contacto,t.telefono,t.email,t.id
from dblink('src','select id,nombre,rut,contacto,telefono,email from kam_proveedores')
  as t(id text,nombre text,rut text,contacto text,telefono text,email text)
where not exists (select 1 from proveedores p
  where p.empresa_id=(select id from empresas where slug='kamiana') and p.legacy_id=t.id);

-- Productos (solo no borrados)
insert into productos (empresa_id,nombre,sku,categoria,costo,precio,proveedor,imagen,deleted,legacy_id)
select (select id from empresas where slug='kamiana'),
       t.nombre,t.sku,t.categoria,t.costo,t.precio,t.proveedor,t.imagen,false,t.id
from dblink('src','select id,nombre,sku,categoria,costo,precio,proveedor,imagen,coalesce(deleted,false) as deleted from kam_productos where coalesce(deleted,false)=false')
  as t(id text,nombre text,sku text,categoria text,costo numeric,precio numeric,proveedor text,imagen text,deleted boolean)
where not exists (select 1 from productos p
  where p.empresa_id=(select id from empresas where slug='kamiana') and p.legacy_id=t.id);

-- Cotizaciones (KAMIANA guarda la cotizacion real dentro de data: items, pct,
-- despacho, despMode, clienteId). Se ligan al cliente por legacy_id.
insert into cotizaciones (empresa_id,numero,fecha,cliente_id,vendedor_name,items,despacho,pct,obs,estado,oc_numero,aprobada_fecha,data,legacy_id)
select (select id from empresas where slug='kamiana'),
       t.numero,
       case when t.fecha ~ '^\d{4}-\d{2}-\d{2}' then t.fecha::date else null end,
       cl.id,
       coalesce(t.data->>'vendedorName', t.vendedor_name),
       t.data->'items',
       case when (t.data->>'despacho') ~ '^-?\d+(\.\d+)?$' then (t.data->>'despacho')::numeric else 0 end,
       case when (t.data->>'pct') ~ '^-?\d+(\.\d+)?$' then (t.data->>'pct')::numeric else null end,
       t.obs,
       coalesce(nullif(t.estado,''),'pendiente'),
       t.oc_numero,
       case when t.aprobada_fecha ~ '^\d{4}-\d{2}-\d{2}' then t.aprobada_fecha::date else null end,
       t.data, t.id
from dblink('src','select id,numero,fecha,vendedor_name,obs,estado,oc_numero,aprobada_fecha,data from kam_cotizaciones')
  as t(id text,numero text,fecha text,vendedor_name text,obs text,estado text,oc_numero text,aprobada_fecha text,data jsonb)
left join clientes cl on cl.empresa_id=(select id from empresas where slug='kamiana')
     and cl.legacy_id=(t.data->>'clienteId')
where not exists (select 1 from cotizaciones c
  where c.empresa_id=(select id from empresas where slug='kamiana') and c.legacy_id=t.id);

-- ============================================================================
--  MOBILIARIOTECH  (empresa slug = 'mobiliariotech')
--  Columnas cortas: productos n/c/p/prov/cost/i ; cotizaciones dentro de data.
-- ============================================================================

insert into clientes (empresa_id,nombre,rut,direccion,telefono,email,legacy_id)
select (select id from empresas where slug='mobiliariotech'),
       t.nombre,t.rut,t.dir,t.tel,t.email,t.id::text
from dblink('src','select id,nombre,rut,dir,tel,email from mtc_clientes')
  as t(id bigint,nombre text,rut text,dir text,tel text,email text)
where not exists (select 1 from clientes c
  where c.empresa_id=(select id from empresas where slug='mobiliariotech') and c.legacy_id=t.id::text);

insert into proveedores (empresa_id,nombre,contacto,telefono,email,legacy_id)
select (select id from empresas where slug='mobiliariotech'),
       t.nombre,t.contacto,t.tel,t.email,t.id::text
from dblink('src','select id,nombre,contacto,tel,email from mtc_proveedores')
  as t(id bigint,nombre text,contacto text,tel text,email text)
where not exists (select 1 from proveedores p
  where p.empresa_id=(select id from empresas where slug='mobiliariotech') and p.legacy_id=t.id::text);

insert into productos (empresa_id,nombre,sku,categoria,costo,precio,proveedor,imagen,deleted,legacy_id)
select (select id from empresas where slug='mobiliariotech'),
       t.n,t.sku,t.c,t.cost,t.p,t.prov,t.i,false,t.id::text
from dblink('src','select id,n,c,p,prov,cost,i,sku,coalesce(deleted,false) as deleted from mtc_productos where coalesce(deleted,false)=false')
  as t(id bigint,n text,c text,p numeric,prov text,cost numeric,i text,sku text,deleted boolean)
where not exists (select 1 from productos pr
  where pr.empresa_id=(select id from empresas where slug='mobiliariotech') and pr.legacy_id=t.id::text);

insert into cotizaciones (empresa_id,numero,fecha,vendedor_name,items,despacho,pct,estado,oc_numero,data,legacy_id)
select (select id from empresas where slug='mobiliariotech'),
       coalesce(nullif(t.numero,''), t.data->>'n'),
       case when t.data->>'fechaISO' ~ '^\d{4}-\d{2}-\d{2}' then (t.data->>'fechaISO')::date else null end,
       coalesce(nullif(t.usuario,''), t.data->>'usuario'),
       t.data->'items',
       case when (t.data->>'despacho') ~ '^-?\d+(\.\d+)?$' then (t.data->>'despacho')::numeric else 0 end,
       case when (t.data->>'recargo')  ~ '^-?\d+(\.\d+)?$' then (t.data->>'recargo')::numeric else null end,
       coalesce(nullif(t.estado,''), t.data->>'estado','pendiente'),
       t.data->>'ocN',
       t.data, t.id::text
from dblink('src','select id,numero,usuario,estado,data from mtc_cotizaciones')
  as t(id bigint,numero text,usuario text,estado text,data jsonb)
where not exists (select 1 from cotizaciones c
  where c.empresa_id=(select id from empresas where slug='mobiliariotech') and c.legacy_id=t.id::text);

-- ============================================================================
--  Recalcular TOTAL de KAMIANA (data no traía total: precio + despacho + IVA)
-- ============================================================================
with e as (select id from empresas where slug='kamiana'),
base as (
  select c.id,
    sum((case when coalesce((it->>'precioFijo')::numeric,0)>0 then (it->>'precioFijo')::numeric
              else round(coalesce((it->>'costo')::numeric,0)*(1+coalesce(c.pct,0)/100)) end)
        * coalesce((it->>'cantidad')::numeric,0)) as base_total,
    sum(coalesce((it->>'cantidad')::numeric,0)) as unid_total
  from cotizaciones c, lateral jsonb_array_elements(coalesce(c.items,'[]'::jsonb)) it
  where c.empresa_id=(select id from e) group by c.id
),
fac as (
  select c.id, c.pct, c.despacho, b.base_total, b.unid_total,
    case when coalesce(c.data->>'despMode','pct')<>'lineal' and b.base_total>0 and coalesce(c.despacho,0)>0 then c.despacho/b.base_total else 0 end as factor,
    case when coalesce(c.data->>'despMode','pct')='lineal' and b.unid_total>0 and coalesce(c.despacho,0)>0 then c.despacho/b.unid_total else 0 end as porunidad
  from cotizaciones c join base b on b.id=c.id where c.empresa_id=(select id from e)
),
neto as (
  select f.id, sum(round((case when coalesce((it->>'precioFijo')::numeric,0)>0 then (it->>'precioFijo')::numeric
                               else round(coalesce((it->>'costo')::numeric,0)*(1+coalesce(f.pct,0)/100)) end)
                         *(1+f.factor)+f.porunidad)*coalesce((it->>'cantidad')::numeric,0)) as neto
  from fac f join cotizaciones c on c.id=f.id, lateral jsonb_array_elements(coalesce(c.items,'[]'::jsonb)) it
  group by f.id
)
update cotizaciones c set data=jsonb_set(coalesce(c.data,'{}'::jsonb),'{total}',to_jsonb(round(n.neto*1.19)))
from neto n where c.id=n.id and (c.data->>'total') is null;

-- ============================================================================
--  Contadores de numeracion (por empresa, formato COT-#####)
-- ============================================================================
insert into contadores (empresa_id, tipo, ultimo)
select empresa_id, 'cotizacion',
       coalesce(max( substring(numero from '^COT-0*([0-9]{1,7})$')::int ), 0)
from cotizaciones where numero ~ '^COT-[0-9]{1,7}$'
group by empresa_id
on conflict (empresa_id, tipo) do update set ultimo = greatest(contadores.ultimo, excluded.ultimo);

-- Cerrar la conexion remota
select dblink_disconnect('src');

-- ============================================================================
--  Verificacion
-- ============================================================================
select nombre, clientes, cotizaciones, cotiz_aprobadas, ventas_aprobadas
from v_resumen_empresas order by nombre;
