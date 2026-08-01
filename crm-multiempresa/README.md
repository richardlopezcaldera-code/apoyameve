# CRM Multiempresa (enterprise)

Evolución del **Cotizador KAMIANA v30** (mono-empresa) a un **CRM multi-tenant**:
muchas empresas sobre una sola base Supabase, aisladas por `empresa_id` + RLS, con
un **Panel Holding** (super admin) que las ve todas.

Este módulo es el **blueprint + esquema SQL** listos para llevar el sistema a
"gran empresa que ve muchas empresas". No reemplaza aún el HTML de la app: define
la base sobre la que se adapta (ver checklist §7 del blueprint).

## Contenido

```
crm-multiempresa/
├─ docs/
│  └─ BLUEPRINT_ENTERPRISE.md    Documento maestro: arquitectura, seguridad,
│                                roles, panel holding, migración y roadmap.
└─ db/
   ├─ 01_schema_multiempresa.sql Esquema multi-tenant + RLS + funciones + vistas.
   ├─ 02_seed_demo.sql           Dos empresas de ejemplo para probar el aislamiento.
   └─ 03_migracion_kam.sql       Importa los datos de una v30 (tablas kam_*) como
                                 un tenant más.
```

## Puesta en marcha (rápida)

1. Crea **un** proyecto en [supabase.com](https://supabase.com) (uno solo, para
   todas las empresas).
2. En **SQL Editor**, ejecuta en orden:
   `01_schema_multiempresa.sql` → `02_seed_demo.sql` (opcional).
3. **Authentication → Users → Add user**: crea tu usuario y márcalo super admin:
   ```sql
   update perfiles set es_super_admin = true where email = 'tu-correo@dominio.com';
   ```
4. Verifica el aislamiento y el consolidado:
   ```sql
   select * from v_resumen_empresas;
   ```
5. Adapta la app (login con Supabase Auth + empresa activa + tablas nuevas):
   ver **§7 del blueprint**.

## Idea en una frase

Una tabla **`empresas`** + **`empresa_id`** en cada fila + **RLS** por tenant +
**Supabase Auth** = cada empresa ve sólo lo suyo y el holding las ve todas.

Detalle completo en [`docs/BLUEPRINT_ENTERPRISE.md`](./docs/BLUEPRINT_ENTERPRISE.md).
