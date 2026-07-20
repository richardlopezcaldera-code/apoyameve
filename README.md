# Sistema de Licitaciones + IA

Backend para buscar oportunidades de **Mercado Público** (ChileCompra), analizarlas
con **Claude** y preparar **cotizaciones**. Pensado para enlazarse a tu web.

## Estructura

```
licitaciones-app/
├── docker-compose.yml        # Postgres local (crea el esquema al arrancar)
├── schema.sql                # Tablas: licitaciones, perfiles, seguimiento, COTIZACIONES
├── requirements.txt
├── .env.example              # Copia a .env y completa credenciales
├── app/
│   ├── config.py             # Variables de entorno
│   ├── db.py                 # Conexión a Postgres
│   ├── mercadopublico.py     # Cliente de la API de Mercado Público
│   ├── ingesta.py            # Job diario: descarga licitaciones -> BD
│   ├── main.py               # FastAPI (monta los routers)
│   ├── ia/
│   │   ├── system_prompt.txt # Prompt del asistente (editable)
│   │   └── claude.py         # Llamadas a Claude
│   └── routers/
│       ├── oportunidades.py  # /oportunidades  (búsqueda + ficha)
│       ├── ia.py             # /ia/resumen, /ia/chat
│       └── cotizaciones.py   # /cotizaciones  (base para la fase 2)
└── frontend/
    └── index.html            # Demo mínima del buscador + resumen IA
```

## Puesta en marcha

1. **Requisitos**: Python 3.11+, Docker (para Postgres) o un Postgres propio.

2. **Credenciales**:
   ```bash
   cp .env.example .env
   # edita .env:
   #  - MP_TICKET: pídelo con Clave Única en
   #    https://api.mercadopublico.cl/modules/IniciarSesion.aspx
   #  - ANTHROPIC_API_KEY: consola de Anthropic
   ```

3. **Base de datos**:
   ```bash
   docker compose up -d db          # levanta Postgres y aplica schema.sql
   ```

4. **Dependencias y servidor**:
   ```bash
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload     # API en http://localhost:8000
   ```
   Documentación interactiva: http://localhost:8000/docs

5. **Ingesta de datos** (primera carga y luego por cron diario):
   ```bash
   python -m app.ingesta
   ```
   Cron sugerido (3:00 AM):
   ```
   0 3 * * *  cd /ruta/licitaciones-app && .venv/bin/python -m app.ingesta
   ```

6. **Frontend demo**: abre `frontend/index.html` (ajusta `API` si cambias el host).

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/oportunidades?q=&region=&modalidad=&monto_min=&monto_max=` | Buscar licitaciones |
| GET | `/oportunidades/{codigo}` | Ficha completa |
| POST | `/ia/resumen/{codigo}` | Resumen ejecutivo + fechas + criterios (cacheado) |
| POST | `/ia/chat/{codigo}` | Chat sobre las bases `{pregunta, historial}` |
| POST | `/cotizaciones` | Crear cotización con ítems |
| GET | `/cotizaciones/{id}` | Obtener cotización con totales |
| GET | `/cotizaciones?user_id=&codigo_lic=` | Listar cotizaciones |
| POST | `/cotizaciones/mapear/{codigo_lic}?margen_pct=` | **IA**: mapea ítems de la licitación con tu catálogo y sugiere precios |
| GET | `/cotizaciones/{id}/pdf` | Descarga la cotización en PDF |
| POST | `/captacion/escanear?umbral=` | Escanea Mercado Público y captura oportunidades afines |
| GET | `/captacion/oportunidades?min_score=&estado=` | Lista las oportunidades capturadas |

## Sistema de CAPTACIÓN (el núcleo)

Detecta automáticamente qué licitaciones te sirven, sin buscar a mano.

- **Perfil de captación** (`app/perfil_captacion.json`): palabras clave y familias
  UNSPSC derivadas de tu catálogo. Regenerable cuando cambie tu catálogo.
- **Motor de scoring** (`app/captacion.py`): puntúa cada licitación 0-100 según
  palabras clave en el nombre/descripción y **UNSPSC de los ítems** (lo más
  fuerte). Umbral recomendado: **35**.
- **Escaneo diario** (`app/captacion_scan.py`, por cron): escanea las activas,
  guarda las nuevas capturas y **notifica**. Al capturar, persiste también el
  detalle de la licitación en `licitaciones`, así la captación funciona por sí
  sola aunque la ingesta general aún no haya corrido.
- **Entrega multicanal** (`app/notificaciones.py`):
  - **Correo + Google Sheet**: vía tu Google Apps Script (`apps_script_captacion.gs`,
    pega y despliega; pon la URL en `CAPTACION_WEBHOOK_URL`).
  - **WhatsApp**: link `wa.me` prellenado (envío 1-clic). El push 100% automático
    requiere un proveedor (Twilio / WhatsApp Cloud API).
  - **Panel web en vivo**: `frontend/captacion.html`.

Cron sugerido (8:00 y 15:00):
```
0 8,15 * * *  cd /ruta/licitaciones-app && .venv/bin/python -m app.captacion_scan
```

> Validado con datos reales: la licitación "Mobiliario y Equipamiento para
> Residencias Familiares" (Araucanía, $20.234.260) obtuvo **score 75** y fue
> capturada; licitaciones de tachas o medicamentos obtuvieron 0 y se descartaron.

## Sistema de cotizaciones (fase 2 — implementado)

Flujo completo:
1. **Conector de catálogo en vivo** (`app/catalogo.py`): consulta tu sistema por
   API (`CATALOGO_API_URL`). Solo debes ajustar `_normalizar()` si tu API usa
   otros nombres de campo. El `codigo_unspsc` mejora mucho el emparejamiento.
2. **Mapeo con IA** (`POST /cotizaciones/mapear/{codigo_lic}`): por cada ítem de
   la licitación busca candidatos en tu catálogo y Claude elige el mejor match
   (con nivel de confianza y motivo).
3. **Precio sugerido**: `precio = costo / (1 - margen/100)` con `MARGEN_OBJETIVO_PCT`.
4. **Panel UI** (`frontend/cotizador.html`): tabla editable con el borrador
   mapeado; ajustas cantidades/precios, guardas y descargas el PDF.
5. **PDF** (`app/pdf.py`, `GET /cotizaciones/{id}/pdf`): oferta lista para adjuntar.

El campo `cotizacion_items.item_lic_ref` mantiene el vínculo línea de oferta ↔
ítem de la licitación (`licitaciones.items_json`).

> Para conectar tu catálogo: expón (o adapta) un endpoint que reciba `?q=&limit=`
> y devuelva `{"productos":[{id,sku,nombre,descripcion,unidad,costo,precio,
> categoria,codigo_unspsc}]}`, y ponlo en `CATALOGO_API_URL`.

## Notas
- El ticket de Mercado Público y la API key de Claude viven SOLO en el backend.
- Límite de la API: 10.000 solicitudes/día por ticket. La ingesta solo pide el
  detalle de licitaciones nuevas para no agotarlo.
- Valida los nombres de campos del detalle (`CodigoExterno`, `Comprador`,
  `Fechas`, `Items`…) contra el Diccionario de Datos oficial la primera vez.
