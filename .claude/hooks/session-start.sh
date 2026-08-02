#!/bin/bash
# SessionStart hook — instala dependencias para que el proyecto y los
# servidores MCP declarados en .mcp.json funcionen en cada sesión.
# Idempotente: seguro de correr varias veces.
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

# ── PATH para binarios instalados por pip/pipx (postgres-mcp, pipx) ──
export PATH="$HOME/.local/bin:$PATH"
# Persistir el PATH para el resto de la sesión.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$CLAUDE_ENV_FILE"
fi

# ── 1) Dependencias de Node (Cloudflare Workers + Hono) ──
if [ -f package.json ]; then
  echo "[session-start] npm install…"
  npm install --no-audit --no-fund
fi

# ── 2) postgres-mcp (servidor MCP 'postgres' de .mcp.json) ──
# Requiere Python >= 3.12; el python3 por defecto suele ser 3.11.
if command -v postgres-mcp >/dev/null 2>&1; then
  echo "[session-start] postgres-mcp ya instalado."
else
  echo "[session-start] instalando postgres-mcp…"
  # pipx puede no venir preinstalado.
  if ! command -v pipx >/dev/null 2>&1 && ! python3 -m pipx --version >/dev/null 2>&1; then
    pip install --user pipx >/dev/null
  fi
  # Elegir un intérprete >= 3.12.
  PY312="$(command -v python3.12 || true)"
  if [ -z "$PY312" ] && [ -x /usr/bin/python3.12 ]; then
    PY312=/usr/bin/python3.12
  fi
  if [ -n "$PY312" ]; then
    python3 -m pipx install --python "$PY312" --backend pip postgres-mcp || \
      echo "[session-start] AVISO: no se pudo instalar postgres-mcp (se omite)."
  else
    echo "[session-start] AVISO: no hay Python >= 3.12; se omite postgres-mcp."
  fi
fi

echo "[session-start] listo."
