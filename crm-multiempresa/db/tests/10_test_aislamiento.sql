\set ON_ERROR_STOP on
\pset pager off

-- ===== Fixtures: 3 usuarios de Auth (el trigger crea sus perfiles) =========
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000aa','super@holding.com','{"nombre":"Super Holding"}'),
 ('00000000-0000-0000-0000-0000000000a1','adminx@x.com','{"nombre":"Admin X"}'),
 ('00000000-0000-0000-0000-0000000000b1','adminy@y.com','{"nombre":"Admin Y"}');
update perfiles set es_super_admin=true where id='00000000-0000-0000-0000-0000000000aa';

\echo '=== Perfiles creados por el trigger (esperado: 3) ==='
select count(*) as perfiles from perfiles;

-- ===== Como SUPER ADMIN: crear dos empresas con su admin ===================
set role authenticated;
set test.uid = '00000000-0000-0000-0000-0000000000aa';
select crear_empresa_con_admin('Empresa X','00000000-0000-0000-0000-0000000000a1','76.1-1','x','pro') as ex \gset
select crear_empresa_con_admin('Empresa Y','00000000-0000-0000-0000-0000000000b1','76.2-2','y','basico') as ey \gset
-- Guardo el id de Y en una GUC de sesion para usarlo dentro de bloques DO
select set_config('test.ey', :'ey', false);
\echo '=== Empresas visibles para el super admin (esperado: 2) ==='
select count(*) as empresas from empresas;

-- ===== Como ADMIN X: opera dentro de X ====================================
set test.uid = '00000000-0000-0000-0000-0000000000a1';
insert into clientes(empresa_id,nombre,rut) values (:'ex','Cliente X1','11-1');
insert into clientes(empresa_id,nombre,rut) values (:'ex','Cliente X2','22-2');
\echo '=== Admin X ve SUS clientes (esperado: 2) ==='
select count(*) as clientes_visibles_por_X from clientes;

-- ===== Como ADMIN Y: opera dentro de Y ====================================
set test.uid = '00000000-0000-0000-0000-0000000000b1';
insert into clientes(empresa_id,nombre,rut) values (:'ey','Cliente Y1','33-3');
\echo '=== Admin Y ve SUS clientes (esperado: 1, NO ve los de X) ==='
select count(*) as clientes_visibles_por_Y from clientes;

-- ===== AISLAMIENTO: X no puede leer datos de Y ============================
set test.uid = '00000000-0000-0000-0000-0000000000a1';
\echo '=== Admin X intenta leer clientes de Y por empresa_id (esperado: 0) ==='
select count(*) as fugas_X_hacia_Y from clientes where empresa_id = :'ey';

-- ===== AISLAMIENTO: X no puede ESCRIBIR en Y (RLS with check) =============
\echo '=== Admin X intenta INSERTAR un cliente en Y con el id real de Y (esperado: BLOQUEADO) ==='
do $$
begin
  insert into clientes(empresa_id,nombre) values (current_setting('test.ey')::uuid,'intruso');
  raise notice 'FALLO: se permitio escribir en la empresa Y';
exception when others then raise notice 'OK: RLS bloqueo la escritura en Y (%).', sqlerrm;
end $$;

-- ===== Numeracion por empresa =============================================
\echo '=== Numeracion de X (esperado: COT-00001 y COT-00002) ==='
select siguiente_numero(:'ex','cotizacion','COT') as n1;
select siguiente_numero(:'ex','cotizacion','COT') as n2;

\echo '=== Admin X pide numero de Y con el id real de Y (esperado: EXCEPCION sin acceso) ==='
do $$
begin
  perform siguiente_numero(current_setting('test.ey')::uuid,'cotizacion','COT');
  raise notice 'FALLO: X obtuvo numero de Y';
exception when others then raise notice 'OK: bloqueado (%).', sqlerrm;
end $$;

-- ===== Panel Holding: consolidado ve TODO =================================
set test.uid = '00000000-0000-0000-0000-0000000000aa';
\echo '=== v_resumen_empresas para el super admin (esperado: 2 filas) ==='
select nombre, usuarios, clientes, cotizaciones from v_resumen_empresas order by nombre;

-- ===== Anti-escalada: un usuario no puede auto-nombrarse super admin ======
set test.uid = '00000000-0000-0000-0000-0000000000a1';
\echo '=== Admin X intenta volverse super admin (esperado: BLOQUEADO/sin efecto) ==='
do $$
begin
  update perfiles set es_super_admin=true where id=auth.uid();
  if (select es_super_admin from perfiles where id=auth.uid()) then
    raise notice 'FALLO: X se volvio super admin';
  else
    raise notice 'OK: X sigue sin ser super admin';
  end if;
exception when others then raise notice 'OK: bloqueado (%).', sqlerrm;
end $$;

reset role;
\echo '=== FIN DE PRUEBAS ==='
