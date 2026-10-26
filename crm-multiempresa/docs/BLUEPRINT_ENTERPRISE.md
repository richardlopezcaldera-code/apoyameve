# CRM Multiempresa — Blueprint Enterprise

Versión evolucionada del **Cotizador KAMIANA v30** (mono-empresa) hacia un
**CRM multi-tenant** donde muchas empresas conviven en un mismo sistema y un
**holding / super admin** puede verlas todas.

> Este documento es el "prompt/proyecto" potenciado: describe QUÉ construir y
> CÓMO, para escalar de 1 empresa a cientos. El esquema SQL que lo acompaña
> está en `../db/`.

---

## 0. Resumen ejecutivo

| | v30 (hoy) | Enterprise (objetivo) |
|---|---|---|
| Empresas por instalación | **1** | **N** (muchas) |
| Base de datos | Un Supabase por empresa | **Un solo Supabase**, aislado por `empresa_id` + RLS |
| Login | Tabla `kam_usuarios`, **clave en texto plano**, `anon key` para todo | **Supabase Auth** (JWT real), contraseñas hasheadas |
| Aislamiento de datos | Físico (proyectos separados) | **Lógico por fila** (RLS por tenant) |
| Ver "todas las empresas" | Imposible sin entrar a cada base | **Panel Holding** (super admin) con consolidado |
| Roles | admin / vendedor | super_admin, admin_empresa, supervisor, vendedor, solo_lectura |
| Numeración de cotizaciones | Secuencia global única | **Por empresa** (cada una desde su 1) |
| Onboarding de empresa | Clonar todo el stack a mano | Alta desde el panel (1 función SQL) |

El corazón del cambio es **una tabla `empresas` (tenants)** + **`empresa_id` en
cada fila** + **RLS** que garantiza que cada empresa sólo ve lo suyo, mientras
el super admin ve el consolidado.

---

## 1. Arquitectura enterprise

```
                    ┌───────────────────────────────────────────┐
                    │  Navegador (SPA / HTML)                     │
                    │  - Login vía Supabase Auth (JWT)            │
                    │  - Selector de empresa (si es multi-membresía)
                    │  - Panel Holding si es super_admin          │
                    └───────────────┬───────────────────────────┘
                                    │ JWT del usuario (no anon key)
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │  Supabase (una sola instancia)                          │
        │  ┌─────────────┐  ┌──────────────────────────────────┐ │
        │  │ Auth        │  │ PostgreSQL + RLS por empresa_id   │ │
        │  │ (usuarios)  │  │  empresas · perfiles · membresias │ │
        │  └─────────────┘  │  clientes · productos · ...       │ │
        │                   │  RLS: tiene_acceso_empresa()      │ │
        │                   └──────────────────────────────────┘ │
        └───────────────────────────────────────────────────────┘
                                    ▲
                                    │ (puentes existentes se mantienen)
        ┌───────────────────────────────────────────────────────┐
        │  Cloudflare Worker  (/api/mp, /api/ca, /api/websearch) │
        │  Google Apps Script (correo, proxy Compra Ágil)        │
        └───────────────────────────────────────────────────────┘
```

Lo que **NO cambia** respecto de la v30: los puentes de integración
(Mercado Público, Compra Ágil, búsqueda web, correo por Apps Script) siguen
igual. Lo que cambia es **la base de datos y la autenticación**.

> Nota multi-integración: hoy `MP_TICKET` y el ticket de Compra Ágil son globales
> en el Worker. En enterprise, cada empresa puede tener su propio ticket. La vía
> recomendada es guardarlos en `empresas.config` y que el Worker lea el ticket
> de la empresa activa (ver §7.4), en lugar de un secreto único por Worker.

---

## 2. Modelo de datos multi-tenant

Tablas núcleo (detalle en `../db/01_schema_multiempresa.sql`):

- **`empresas`** — un tenant por fila. Incluye `plan`, `estado` y `config`
  (jsonb con `pct_venta`, `iva`, `moneda`, URL de Apps Script, firmas del PDF…).
- **`perfiles`** — 1:1 con `auth.users`. Bandera `es_super_admin` para el holding.
- **`membresias`** — `usuario ↔ empresa ↔ rol`. Un usuario puede estar en varias
  empresas con distinto rol. Es la pieza que habilita el multi-tenant real.
- **Negocio** — `clientes`, `productos`, `proveedores`, `cotizaciones`, todas con
  `empresa_id` y `legacy_id` (para migrar sin perder referencias).
- **`contadores`** — numeración por empresa. `auditoria` — bitácora de acciones.

Regla de oro: **toda tabla de negocio lleva `empresa_id not null`** y **toda
consulta pasa por RLS**. Nunca se filtra por empresa "a mano" en el frontend
como única barrera: el aislamiento lo garantiza la base.

---

## 3. Seguridad multi-tenant (lo más importante)

### 3.1 Por qué se abandona el modelo de la v30
En la v30 el HTML lleva `SUPA_KEY` (anon) y las políticas RLS son
`using (true)`: **cualquiera con la página puede leer/escribir todo**, incluidas
las contraseñas en texto plano de `kam_usuarios`. Eso es aceptable para una
herramienta interna de una empresa, pero **inaceptable** cuando muchas empresas
comparten la base: un tenant podría leer los datos de otro.

### 3.2 Modelo enterprise
- **Autenticación:** Supabase Auth. El usuario inicia sesión y el navegador usa
  **su JWT** (no la anon key) en cada request. `auth.uid()` identifica al usuario
  dentro de la base.
- **Autorización:** RLS. Cada política pregunta `tiene_acceso_empresa(empresa_id)`,
  que devuelve verdadero si el usuario es super admin o tiene membresía activa en
  esa empresa. Ver funciones en el esquema (`es_super_admin()`,
  `empresas_de_usuario()`, `tiene_acceso_empresa()`, `es_admin_empresa()`).
- **Contraseñas:** las gestiona Supabase Auth (hash + políticas). Se elimina la
  columna `pass` en texto plano.
- **Menor superficie:** la anon key deja de dar acceso a datos; sólo sirve para
  el flujo de login. Las tablas exigen sesión autenticada.

### 3.3 Prueba de aislamiento (aceptación)
1. Crear empresa A y empresa B, cada una con un usuario admin.
2. Iniciar sesión como admin de A → sólo ve clientes/cotizaciones de A.
3. Intentar (por API con el JWT de A) leer una fila de B → **0 resultados**.
4. Iniciar sesión como super admin → `v_resumen_empresas` lista A **y** B.

---

## 4. Roles y permisos

| Rol | Alcance | Puede |
|---|---|---|
| **super_admin** | Toda la plataforma (holding) | Ver/gestionar todas las empresas, crear/suspender empresas, ver consolidado |
| **admin_empresa** | Su(s) empresa(s) | Todo dentro de su empresa: usuarios, config, catálogo, aprobar cotizaciones |
| **supervisor** | Su empresa | Como admin salvo gestionar la config sensible/facturación (ajustable) |
| **vendedor** | Su empresa | Crear/editar sus cotizaciones y clientes; no aprueba ni gestiona usuarios |
| **solo_lectura** | Su empresa | Ver reportes y cotizaciones; sin editar |

Los roles se guardan en `membresias.rol`. El frontend arma el menú según el rol
(igual que hoy `MODULES.filter(m => m.roles.includes(rol))`), pero **la barrera
real es RLS**, no el menú.

---

## 5. Panel Holding (ver muchas empresas)

Objetivo del pedido: *"una gran empresa que ve muchas empresas usando el sistema"*.

- El super admin entra y ve un **dashboard consolidado** basado en la vista
  `v_resumen_empresas`: por cada empresa, cantidad de usuarios, clientes,
  cotizaciones, aprobadas y ventas.
- Puede **entrar "como" una empresa** (elegir un tenant y trabajar dentro de él)
  o ver métricas agregadas de todas.
- Acciones: crear empresa (`crear_empresa_con_admin`), suspender/activar
  (`empresas.estado`), cambiar de plan (`empresas.plan`).

Consultas típicas del panel (ya respetan RLS — super admin ve todo):
```sql
-- Tablero de empresas
select * from v_resumen_empresas order by ventas_aprobadas desc;

-- Ranking de vendedores en TODAS las empresas
select empresa_id, vendedor_name, count(*) cotizaciones
from cotizaciones group by 1,2 order by 3 desc;
```

---

## 6. Escalabilidad y "multi-sistema"

- **Índices por `empresa_id`** en todas las tablas de negocio (ya incluidos):
  cada empresa consulta sólo su partición lógica → rendimiento estable al crecer.
- **Numeración por empresa** vía `contadores` (evita el cuello de botella de una
  secuencia global y hace que cada empresa numere desde 1).
- **Planes** (`empresas.plan`): permite límites por tenant (usuarios, cotizaciones)
  y facturación por uso más adelante.
- **Crecimiento futuro** si un tenant se vuelve gigante: se puede promover a su
  propio proyecto Supabase sin cambiar el modelo (el `empresa_id` ya aísla todo).
- **Particionado** (opcional a gran escala): `cotizaciones` puede particionarse por
  `empresa_id` o por rango de fecha si el volumen lo exige.

---

## 7. Qué cambiar en la app (checklist para el HTML)

El archivo `Cotizador_KAMIANA.html` pasa de mono a multiempresa. Cambios mínimos:

### 7.1 Autenticación
- Reemplazar el login contra `kam_usuarios` por **Supabase Auth**
  (`supabase.auth.signInWithPassword`). Usar el SDK `@supabase/supabase-js` o
  llamar al endpoint `/auth/v1/token`.
- Tras el login, usar el **access_token del usuario** como `Authorization: Bearer`
  en todas las llamadas REST (en vez de la anon key).

### 7.2 Empresa activa
- Al iniciar sesión, leer las membresías del usuario (`select * from membresias`).
  - 1 empresa → se selecciona sola.
  - varias → **selector de empresa** (guardar `empresa_id` en memoria de sesión).
  - super admin → mostrar el **Panel Holding** + poder "entrar como" una empresa.
- Guardar `EMPRESA_ID` en una variable de sesión (no en el HTML fijo).

### 7.3 Consultas
- Añadir `empresa_id` a cada `INSERT`/`UPSERT`. En los `SELECT` **no hace falta**
  filtrar por empresa (RLS ya lo hace), pero se puede para eficiencia:
  `?empresa_id=eq.<id>`.
- Renombrar tablas: `kam_clientes → clientes`, `kam_productos → productos`, etc.
- Numeración: reemplazar `kam_next_cot()` por
  `rpc/siguiente_numero` con `{ "p_empresa": "<id>", "p_tipo":"cotizacion" }`.

### 7.4 Config e integraciones por empresa
- Leer `pct_venta`, `iva`, `moneda`, `apps_script_url`, firmas del PDF desde
  `empresas.config` de la empresa activa (ya no de una constante global).
- (Opcional) Tickets de Mercado Público / Compra Ágil por empresa en `config`,
  y que el Worker los lea de la empresa activa.

### 7.5 Menú y permisos
- Construir el menú según `membresias.rol` de la empresa activa.
- Añadir el módulo **Panel Holding** visible sólo para `es_super_admin`.

---

## 8. Onboarding de una empresa nueva (flujo)

1. Super admin crea el usuario admin en **Auth** (o lo invita por correo).
2. Super admin llama a `crear_empresa_con_admin('Nombre', <uuid_admin>, rut, slug, plan)`.
   → crea la empresa y la membresía `admin_empresa` en una sola operación.
3. El admin entra, completa `config` (pct, IVA, logo, firmas) y carga catálogo/
   clientes (o migra desde su v30 con `03_migracion_kam.sql`).
4. Listo: la empresa opera aislada; el holding ya la ve en el consolidado.

---

## 9. Plan de migración por fases

- **Fase 0 — Base nueva:** crear proyecto Supabase, ejecutar `01_schema`.
- **Fase 1 — Auth:** activar Supabase Auth, crear super admin, primeros usuarios.
- **Fase 2 — App:** adaptar el HTML (§7). Probar con la empresa demo.
- **Fase 3 — Migración de datos:** importar la v30 con `03_migracion_kam.sql`
  (una empresa = un tenant). Repetir por cada empresa que ya usaba la v30.
- **Fase 4 — Holding:** habilitar el Panel Holding y validar el aislamiento (§3.3).
- **Fase 5 — Cierre:** apagar las bases mono-empresa viejas cuando todo esté OK.

---

## 10. Roadmap enterprise (siguiente nivel)

- **Facturación por tenant** (Stripe): plan/uso, límites por `plan`.
- **Invitaciones por correo** y auto-registro con dominio corporativo.
- **SSO / Google Workspace** vía Supabase Auth providers.
- **Auditoría avanzada** y exportación (la tabla `auditoria` ya está lista).
- **API pública por empresa** con tokens de servicio por tenant.
- **Reportes cross-empresa** (BI) para el holding.

---

## 11. Checklist de despliegue

- [ ] Proyecto Supabase creado (uno solo para todas las empresas).
- [ ] `01_schema_multiempresa.sql` ejecutado sin errores.
- [ ] Supabase Auth activado (Email/Password u OAuth).
- [ ] Al menos un `perfiles.es_super_admin = true`.
- [ ] `02_seed_demo.sql` (opcional) para probar con 2 empresas.
- [ ] Prueba de aislamiento (§3.3) superada.
- [ ] App (HTML) adaptada (§7): Auth + empresa activa + tablas nuevas.
- [ ] Migración de cada v30 con `03_migracion_kam.sql`.
- [ ] Panel Holding operativo (`v_resumen_empresas`).
