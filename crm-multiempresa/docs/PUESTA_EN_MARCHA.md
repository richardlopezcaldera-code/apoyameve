# Puesta en marcha — cargar TODA la base en Supabase

Guía para dejar el CRM multiempresa funcionando con **toda la información de la
v30** (empresa KAMIANA + 1439 productos + usuarios), **sin modificar** tu sistema
actual. Tu Supabase v30 sigue intacto: aquí se crea un proyecto **nuevo**.

> Todos los scripts son **no destructivos e idempotentes**: puedes re-ejecutarlos
> sin duplicar ni borrar nada.

## 0. Crear el proyecto Supabase (nuevo)

1. Entra a [supabase.com](https://supabase.com) → **New project** (uno solo, para
   todas las empresas). Guarda la contraseña de la base.
2. **Project Settings → API**: copia el **Project URL** y la **anon public key**
   (las usarás en `app/index.html`).

## 1. Esquema y datos (SQL Editor, en este orden)

Abre **SQL Editor** y ejecuta, uno por uno:

| # | Archivo | Qué hace |
|---|---------|----------|
| 1 | `db/01_schema_multiempresa.sql` | Tablas, RLS, funciones, vista holding |
| 2 | `db/05_setup_kamiana.sql` | Crea la empresa **KAMIANA** con su marca (RUT, contacto, bancos, firmas) |
| 3 | `db/04_catalogo_kamiana.sql` | Carga los **1439 productos** (costos con parches aplicados) |

Verifica:
```sql
select count(*) from productos;                 -- 1439
select config->>'razon_social' from empresas where slug='kamiana';
```

## 2. Autenticación y usuarios

1. **Authentication → Providers**: activa **Email**.
2. **Authentication → Users → Add user**: crea un usuario (correo + clave) por
   persona. El trigger crea su `perfil` solo.
3. Nombra tu **super admin** (ve todas las empresas):
   ```sql
   update perfiles set es_super_admin = true where lower(email) = 'holding@kamiana.cl';
   ```
4. Asigna roles por empresa: edita los correos en `db/06_usuarios_kamiana.sql` y
   ejecútalo. (admin_empresa / supervisor / vendedor / solo_lectura)

## 3. La app

1. Abre `app/index.html`, completa `SUPA_URL` y `SUPA_ANON` con los datos del
   paso 0.
2. Publícalo igual que la v30 (Cloudflare Pages: sube `index.html`). Los puentes
   del `_worker.js` (Mercado Público / Compra Ágil / correo) siguen igual.
3. Entra: verás el catálogo, podrás crear clientes y cotizaciones, y el super
   admin verá el **Panel Holding** con todas las empresas.

## 4. (Opcional) Traer clientes y cotizaciones históricas de la v30

Sólo si quieres migrar el historial (tu v30 **no se toca**, sólo se exporta):

1. En el proyecto **viejo** (Table Editor → Export to CSV): exporta
   `kam_clientes`, `kam_productos`, `kam_proveedores`, `kam_cotizaciones`.
2. En el proyecto **nuevo** importa esos CSV como tablas de staging
   (`stg_kam_clientes`, `stg_kam_productos`, `stg_kam_proveedores`,
   `stg_kam_cotizaciones`).
3. Ejecuta `db/03_migracion_kam.sql` (no destructivo, mapea por `legacy_id`).

## 5. Añadir MÁS empresas (holding)

Para cada empresa nueva:
1. Crea su usuario admin en Auth.
2. `select crear_empresa_con_admin('Nombre S.A.', '<uuid_admin>', 'RUT', 'slug', 'plan');`
3. Esa empresa opera aislada; el holding la ve en `v_resumen_empresas`.

---

### Resumen del orden

```
01_schema  →  05_setup_kamiana  →  04_catalogo_kamiana  →  (Auth users)  →  06_usuarios_kamiana
                                                                  └─ opcional: 03_migracion_kam
```

Todo validado en PostgreSQL 16: 1439 productos, empresa con marca y firmas,
membresías por correo, aislamiento por RLS. Ver `db/tests/`.
