# Base de datos compartida (Supabase)

apoyameve y el **Cotizador** (`crm-multiempresa`) comparten **el mismo proyecto de
Supabase**, para que ambos vean **la misma información** (productos, clientes,
cotizaciones). Las tablas usan el prefijo `kam_` — esquema en
[`db/schema-kamiana.sql`](../db/schema-kamiana.sql).

## Tablas

| Tabla | Contenido | ¿La usa apoyameve? |
|-------|-----------|--------------------|
| `kam_productos` | Catálogo: `nombre`, `sku`, `categoria`, `costo`, `precio`, `proveedor`, `imagen` | **Sí** — genera avisos con estos productos. |
| `kam_clientes` | Clientes: nombre, RUT, contacto | Lectura disponible. |
| `kam_cotizaciones` | Cotizaciones (ítems, estado, etc.) | Modelo disponible. |
| `kam_proveedores` | Proveedores | Modelo disponible. |
| `kam_usuarios` | Usuarios del Cotizador | Modelo disponible (apoyameve no lo necesita). |
| `kam_config` | Configuración/estado | Modelo disponible. |

Los modelos TypeScript están en [`lib/kamiana.ts`](../lib/kamiana.ts) y el cliente
en [`lib/supabase.ts`](../lib/supabase.ts).

## Configurar la conexión

Ambos proyectos apuntan al **mismo** proyecto de Supabase (misma URL + key):

- **Cotizador (`crm-multiempresa`)**: en su HTML, las claves `SUPA_URL` / `SUPA_KEY`
  (Project Settings → API en Supabase).
- **apoyameve**: las mismas dos claves, con los nombres `SUPABASE_URL` /
  `SUPABASE_KEY`.

### apoyameve — desarrollo local
```bash
cp .dev.vars.example .dev.vars
# completá SUPABASE_URL y SUPABASE_KEY (mismos valores que SUPA_URL/SUPA_KEY del Cotizador)
npm run dev
```

### apoyameve — producción (Cloudflare Workers)
```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_KEY
```

Las credenciales nunca se escriben en el repositorio: van como secrets del Worker
(o en `.dev.vars`, que está en `.gitignore`).

## Rutas para verificar

- `GET /kamiana/productos` — estado de la conexión + lista de productos de la base
  compartida (JSON). Si faltan las claves responde `{ configured: false }`.
- `GET /kamiana/og?id=<id>&format=post|story` — genera el aviso (PNG) de un producto
  del catálogo compartido.

## Seguridad

- El Cotizador define políticas **RLS permisivas** al rol `anon` (cualquiera con la
  anon key puede leer/escribir). apoyameve solo **lee** `kam_productos`; aun así,
  conviene endurecer las políticas y usar una key de servicio para accesos
  server-side. Ver la nota en [`db/schema-kamiana.sql`](../db/schema-kamiana.sql).
- No migres datos a mano entre empresas: cada empresa tiene su propio Supabase.
