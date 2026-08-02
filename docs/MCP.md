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
| `git` | `uvx mcp-server-git` | `uv`/`uvx` instalado | Operaciones de Git sobre el repositorio local (log, diff, status, etc.). |
| `github` | `npx mcp-remote https://api.githubcopilot.com/mcp/` | Login OAuth de GitHub (al primer uso) | Repos, issues y pull requests en GitHub (servidor remoto oficial). |
| `supabase` | `npx @supabase/mcp-server-supabase --read-only` | Variable de entorno `SUPABASE_ACCESS_TOKEN` | Consultas de solo lectura al proyecto de Supabase. |

## Notas

- **`postgres`** requiere el binario `postgres-mcp` (necesita Python ≥3.12). En
  sesiones de Claude Code se instala automáticamente mediante el hook
  [`.claude/hooks/session-start.sh`](../.claude/hooks/session-start.sh); a mano es
  `pipx install --python /usr/bin/python3.12 postgres-mcp`. La conexión se pasa por
  la variable de entorno `DATABASE_URI`, nunca escrita en el repositorio.
- **`playwright`** usa el Chromium ya presente en el entorno; no descarga uno nuevo.
- **`cloudflare`** y **`github`** abren un flujo OAuth en el navegador la primera
  vez. En sesiones no interactivas (cron/headless) pueden no estar disponibles hasta
  autorizarlos una vez de forma interactiva.
- **`supabase`** corre en modo `--read-only`; el token se pasa por
  `SUPABASE_ACCESS_TOKEN`, nunca escrito en el repositorio.
- **`filesystem`**, **`fetch`** y **`git`** no necesitan credenciales.
