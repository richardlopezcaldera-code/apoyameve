# Carga realizada en Supabase (registro)

Proyecto: **htjjxqvzxkrabozopxhe** (tu Supabase actual). Carga **aditiva y no
destructiva**: se crearon tablas nuevas del modelo multiempresa y se copiaron los
datos **dentro de la misma base**. Las tablas `kam_*` y `mtc_*` **no se tocaron**
(verificado: kam 400/168/718 · mtc 160/1001/24).

## Qué se hizo

1. **Esquema multiempresa** aplicado (tablas `empresas`, `perfiles`, `membresias`,
   `clientes`, `productos`, `proveedores`, `cotizaciones`, `contadores`,
   `auditoria`, funciones, RLS y vista `v_resumen_empresas`).
2. **Dos empresas (tenants)** creadas:
   - `kamiana` — SERVICIO KAMIANA SPA (marca completa: RUT, contacto, bancos, firmas).
   - `mobiliariotech` — MobiliarioTech.
3. **Migración de datos reales** (in-DB, por `legacy_id`, idempotente):

| Empresa | Clientes | Productos | Proveedores | Cotizaciones | Aprobadas | Ventas aprobadas |
|---|---|---|---|---|---|---|
| SERVICIO KAMIANA SPA | 400 | 166 | 6 | 718 | 6 | $8.575.622 |
| MobiliarioTech | 160 | 1001 | 7 | 24 | 6 | $3.271.715 |

- KAMIANA: la cotización real vivía en `kam_cotizaciones.data`; se migraron los
  ítems desde ahí y se **recalculó el total** (precio + despacho + IVA 19%) porque
  la v30 no lo guardaba.
- MobiliarioTech: cotizaciones extraídas de `mtc_cotizaciones.data` (formato
  propio con `n/p/q/cost`); el total ya venía en los datos.
4. **Contadores** de numeración fijados (KAMIANA 46, MTC 232 en formato COT-#####).

## Nota sobre el bug corregido

La vista `v_resumen_empresas` tenía JOINs que multiplicaban las ventas por el
número de clientes (fan-out). Se reescribió con subconsultas por empresa. Los
totales por cotización siempre estuvieron bien.

## Falta para poder USAR la app (paso de autenticación)

Los datos están cargados, pero **RLS bloquea todo hasta que haya usuarios**:

1. **Authentication → Providers**: activar **Email**.
2. **Authentication → Users → Add user**: crear el/los usuarios (correo + clave).
3. Super admin del holding:
   ```sql
   update perfiles set es_super_admin = true where lower(email) = 'TU-CORREO';
   ```
4. Asignar roles por empresa: editar correos en `db/06_usuarios_kamiana.sql` y
   ejecutarlo (o usar `crear_empresa_con_admin` para nuevas empresas).
5. En `app/index.html` poner `SUPA_URL = https://htjjxqvzxkrabozopxhe.supabase.co`
   y la **anon key** del proyecto (Project Settings → API), y publicar.

## Reversible

Todo lo nuevo se puede quitar sin afectar la v30:
```sql
drop view if exists v_resumen_empresas;
drop table if exists auditoria, contadores, cotizaciones, proveedores, productos,
  clientes, membresias, perfiles, empresas cascade;
-- (kam_* y mtc_* permanecen intactas)
```
