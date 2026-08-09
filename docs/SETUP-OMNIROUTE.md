# OmniRoute — gateway de IA local

[OmniRoute](https://github.com/diegosouzapw/OmniRoute) (MIT) expone muchos
proveedores de IA detrás de **un solo endpoint compatible con OpenAI**, con
fallback automático entre proveedores y compresión de tokens. Es una herramienta
**de desarrollo**: no forma parte del Worker ni se despliega a Cloudflare.

- Paquete npm: `omniroute` — repo `diegosouzapw/OmniRoute`, autor `diegosouza.pw`.
- Dashboard: `http://localhost:20128`
- API compatible con OpenAI: `http://localhost:20128/v1`

## Instalación

```bash
npm install -g omniroute
omniroute                 # equivale a `omniroute serve`
```

Alternativa con Docker (no requiere Node global):

```bash
docker run -d --name omniroute --restart unless-stopped --stop-timeout 40 \
  -p 127.0.0.1:20128:20128 -v omniroute-data:/app/data diegosouzapw/omniroute:latest
```

No hace falta ninguna API key para arrancar: el modelo `auto` usa proveedores sin
clave. Las claves de proveedores de pago se cargan desde el dashboard.

Estado y datos quedan en `~/.omniroute` (`.env` con la clave de cifrado y
`storage.sqlite`). Ese directorio **no** está en el repo.

## Verificar

```bash
omniroute doctor                                   # diagnóstico general
curl -s http://127.0.0.1:20128/v1/models           # catálogo de modelos
curl -s http://127.0.0.1:20128/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"auto","messages":[{"role":"user","content":"di OK"}],"max_tokens":20}'
```

Otros comandos útiles: `omniroute stop`, `omniroute restart`,
`omniroute simulate "<prompt>"` (muestra qué proveedores se elegirían **sin**
llamar a la API).

## Usarlo desde otra herramienta

Cualquier cliente compatible con OpenAI apunta a la base URL:

```bash
export OPENAI_BASE_URL=http://localhost:20128/v1
export OPENAI_API_KEY=omniroute        # el valor da igual si no configuraste auth
```

`omniroute config` puede reconfigurar CLIs de IA (Claude Code, Codex, Cline…)
para que enruten por OmniRoute. **Ojo:** eso redirige los prompts de esa
herramienta a proveedores de terceros, así que conviene hacerlo a conciencia y no
con datos sensibles del proyecto.

## Limitación en Claude Code on the web

En el contenedor remoto la instalación funciona (`omniroute doctor`: 0 fallos) y
el servidor levanta, pero **las llamadas a proveedores fallan**: la política de
red de salida del entorno solo permite hosts en su allowlist, y los proveedores
de IA no están. El síntoma es:

```
{"error":{"message":"[500]: fetch failed [felo/felo-chat (500)]", ...}}
```

No es un fallo de OmniRoute. Para usarlo de verdad, instalalo **en tu máquina**,
donde la salida a internet no está restringida.

Además el contenedor es efímero: lo instalado se pierde al cerrar la sesión. Por
eso el procedimiento queda documentado acá en vez de commiteado como dependencia.
