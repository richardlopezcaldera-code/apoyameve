# apoyameve-worker

Worker base de **Cloudflare Workers** (Hono + TypeScript), independiente del
generador de avisos de la raíz del repo. Sirve como punto de partida para la
lógica que vaya a correr en el edge.

## Estructura

```
src/index.ts        App Hono: rutas, 404 y manejo de errores
wrangler.toml       Configuración del Worker (vars, entornos, extras comentados)
.dev.vars.example   Plantilla de secrets para desarrollo local
```

## Rutas

| Método | Ruta          | Descripción                                             |
| ------ | ------------- | ------------------------------------------------------- |
| `GET`  | `/`           | Página mínima que confirma que el Worker está activo     |
| `GET`  | `/api/health` | Healthcheck en JSON (app, entorno, timestamp)           |
| `POST` | `/api/echo`   | Ejemplo protegido con `Authorization: Bearer <API_TOKEN>` |

`/api/echo` está como referencia de una ruta autenticada: si `API_TOKEN` no está
configurado responde `503` en vez de quedar abierta.

## Desarrollo local

```bash
cd worker
npm install
cp .dev.vars.example .dev.vars   # completar API_TOKEN
npm run dev                      # http://localhost:8787
```

```bash
npm run typecheck   # tsc
npm run build       # wrangler deploy --dry-run (valida el bundle sin desplegar)
npm run cf-typegen  # regenera los tipos de los bindings
```

## Deploy a Cloudflare

1. Autenticarse una vez:

   ```bash
   npx wrangler login
   ```

2. Cargar los secrets (no se commitean, van cifrados en Cloudflare):

   ```bash
   npx wrangler secret put API_TOKEN
   ```

3. Desplegar:

   ```bash
   npm run deploy            # producción → apoyameve-worker
   npm run deploy:staging    # staging    → apoyameve-worker-staging
   ```

El Worker queda en `https://apoyameve-worker.<tu-subdominio>.workers.dev`.

## Configuración

Las variables públicas van en `[vars]` de `wrangler.toml` y se commitean.
Todo lo sensible va como **secret** (`wrangler secret put`) y en local por
`.dev.vars`, que está en `.gitignore`.

En `wrangler.toml` quedan comentados y listos para activar los dos extras más
habituales: un namespace de **KV** y un **cron trigger**.

## Nota

Este Worker es independiente del de la raíz (`avisos-mobiliariotech`): tiene su
propio `package.json`, `wrangler.toml` y ciclo de deploy. Desplegar uno no afecta
al otro.
