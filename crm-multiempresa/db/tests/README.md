# Arnés de validación del esquema multiempresa

Prueba el esquema (`../01_schema_multiempresa.sql`) y su **aislamiento por RLS**
en un PostgreSQL local, sin tocar ningún Supabase real. Emula lo que Supabase
aporta (roles `anon`/`authenticated`, esquema `auth`, `auth.uid()`).

## Cómo se ejecuta (PostgreSQL local)

```bash
# 1) clúster temporal
initdb -D /tmp/pgtest/data -A trust -U postgres
pg_ctl -D /tmp/pgtest/data -o '-p 5433 -k /tmp/pgtest' start
createdb -h /tmp/pgtest -p 5433 -U postgres crm

# 2) stub de Supabase + esquema + pruebas
PSQL="psql -h /tmp/pgtest -p 5433 -U postgres -d crm -v ON_ERROR_STOP=1"
$PSQL -f tests/00_supabase_stub.sql
$PSQL -f 01_schema_multiempresa.sql
$PSQL -f tests/10_test_aislamiento.sql
```

`10_test_aislamiento.sql` simula al usuario logueado con
`set role authenticated; set test.uid = '<uuid>'`, tal como PostgREST fija el rol
y las claims del JWT en Supabase. La GUC `test.uid` la lee el `auth.uid()` del stub.

> Nota: RLS **solo** actúa sobre roles sin `BYPASSRLS`; por eso las pruebas corren
> como `authenticated`, nunca como el superusuario `postgres`.

## Qué comprueba

1. El trigger crea el `perfil` al alta de un usuario en Auth.
2. `crear_empresa_con_admin` solo lo puede usar un super admin.
3. Cada admin ve **solo** los datos de su empresa (lectura aislada).
4. RLS **bloquea leer** datos de otra empresa (0 filas).
5. RLS **bloquea escribir** en otra empresa (viola la política `with check`).
6. La numeración es **por empresa** (COT-00001, COT-00002…).
7. Pedir un número de otra empresa lanza excepción "Sin acceso".
8. El super admin ve el consolidado `v_resumen_empresas` de todas las empresas.
9. Anti-escalada: un usuario **no** puede auto-nombrarse super admin.

## Resultado esperado (validado en PostgreSQL 16)

Todas las pruebas pasan. Las de aislamiento imprimen `OK: ...` y el consolidado
del holding muestra las dos empresas con sus conteos:

```
  nombre   | usuarios | clientes | cotizaciones
-----------+----------+----------+--------------
 Empresa X |        1 |        2 |            0
 Empresa Y |        1 |        1 |            0
```
