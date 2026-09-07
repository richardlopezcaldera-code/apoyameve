-- ============================================================================
--  SEED DEMO — dos empresas de ejemplo para probar el aislamiento multi-tenant
--  Ejecutar DESPUÉS de 01_schema_multiempresa.sql.
--
--  IMPORTANTE sobre usuarios:
--  Los usuarios reales viven en Supabase Auth (auth.users). Este seed sólo crea
--  EMPRESAS y datos de negocio. Para crear usuarios y asignarlos:
--    1) Authentication → Users → Add user  (crea el correo/clave)
--    2) El trigger crea su fila en `perfiles` automáticamente.
--    3) Márcalo super admin o dale membresía (ver el bloque final, comentado).
-- ============================================================================

-- Dos empresas demo con su configuración (pct venta, IVA, moneda...).
insert into empresas (nombre, rut, slug, plan, config) values
  ('SERVICIO KAMIANA SPA', '77.111.111-1', 'kamiana', 'enterprise',
     '{"pct_venta":35,"iva":19,"moneda":"CLP"}'::jsonb),
  ('COMERCIAL DEMO LTDA',  '77.222.222-2', 'demo',    'pro',
     '{"pct_venta":30,"iva":19,"moneda":"CLP"}'::jsonb)
on conflict (slug) do nothing;

-- Datos de negocio de ejemplo, cada uno amarrado a su empresa por slug.
with e as (select id from empresas where slug = 'kamiana')
insert into clientes (empresa_id, nombre, rut, telefono, email)
select e.id, x.nombre, x.rut, x.tel, x.mail
from e, (values
  ('Municipalidad de Ejemplo', '69.000.000-1', '+56 2 2000 0000', 'compras@ejemplo.cl'),
  ('Constructora Andes SPA',   '76.543.210-9', '+56 9 8888 7777', 'pagos@andes.cl')
) as x(nombre, rut, tel, mail)
where not exists (select 1 from clientes c where c.empresa_id = e.id and c.nombre = x.nombre);

with e as (select id from empresas where slug = 'kamiana')
insert into productos (empresa_id, nombre, sku, categoria, costo, precio, proveedor)
select e.id, x.nombre, x.sku, x.cat, x.costo, x.precio, x.prov
from e, (values
  ('Silla ergonómica', 'SIL-001', 'Mobiliario', 45000, 69990, 'Proveedor A'),
  ('Escritorio 1.4m',  'ESC-014', 'Mobiliario', 78000, 119990,'Proveedor B')
) as x(nombre, sku, cat, costo, precio, prov)
where not exists (select 1 from productos p where p.empresa_id = e.id and p.sku = x.sku);

-- --- Ejemplos para asignar usuarios (descomenta y reemplaza los correos) -----
-- Marcar un super admin (holding, ve todas las empresas):
--   update perfiles set es_super_admin = true where email = 'holding@tudominio.com';
--
-- Dar de alta un admin de la empresa KAMIANA:
--   insert into membresias (empresa_id, usuario_id, rol)
--   select e.id, p.id, 'admin_empresa'
--   from empresas e, perfiles p
--   where e.slug = 'kamiana' and p.email = 'admin.kamiana@tudominio.com'
--   on conflict (empresa_id, usuario_id) do update set rol = excluded.rol, activo = true;
--
-- Dar de alta un vendedor:
--   insert into membresias (empresa_id, usuario_id, rol)
--   select e.id, p.id, 'vendedor'
--   from empresas e, perfiles p
--   where e.slug = 'kamiana' and p.email = 'vendedor1@tudominio.com'
--   on conflict (empresa_id, usuario_id) do update set rol = excluded.rol, activo = true;
