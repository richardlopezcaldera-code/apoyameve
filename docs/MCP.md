# Servidores MCP del proyecto

El archivo [`.mcp.json`](../.mcp.json) declara los servidores MCP que Claude Code
levanta para este repositorio. Resumen de cada uno y qué necesita para funcionar:

| Servidor | Comando | Requisito | Para qué sirve |
|----------|---------|-----------|----------------|
| `postgres` | `postgres-mcp` | Variable de entorno `DATABASE_URI` | Consultas a PostgreSQL en modo restringido (solo lectura). |
| `filesystem` | `npx @modelcontextprotocol/server-filesystem .` | — | Acceso a los archivos del proyecto. |
| `playwright` | `npx @playwright/mcp` | Chromium (preinstalado en el entorno) | Automatización de navegador para QA y scraping. |
| `fetch` | `uvx mcp-server-fetch` | `uv`/`uvx` instalado | Descarga y lectura de contenido web como texto/markdown. |
| `cloudflare` | `npx mcp-remote https://bindings.mcp.cloudflare.com/sse` | Login OAuth de Cloudflare (al primer uso) | Gestión de Workers, D1, KV y R2 (destino de despliegue del proyecto). |

## Notas

- **`postgres`** requiere el binario `postgres-mcp`, que se instala con
  `pipx install --python /usr/bin/python3.12 postgres-mcp` (necesita Python ≥3.12).
  La conexión se pasa por la variable de entorno `DATABASE_URI`, nunca escrita en
  el repositorio.
- **`playwright`** usa el Chromium ya presente en el entorno; no descarga uno nuevo.
- **`cloudflare`** abre un flujo OAuth en el navegador la primera vez. En sesiones
  no interactivas (cron/headless) puede no estar disponible hasta autorizarlo una
  vez de forma interactiva.
- **`filesystem`** y **`fetch`** no necesitan credenciales.
