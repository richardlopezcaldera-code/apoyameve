# Guía: publicar vía Metricool (IG + FB + TikTok en uno)

Ya conectaste tus redes en Metricool, así que este es el camino más simple:
el sistema le manda la pieza a Metricool y Metricool la publica en todas las
redes conectadas. Un solo token, sin apps de Meta/TikTok ni auditorías.

Tus identificadores (del panel de Metricool) ya están cargados:
- **userId:** `5097551`
- **blogId:** `6621202`

---

## Paso 1 — Conseguir el token de API

1. Necesitás un **plan de Metricool con acceso a la API** (Advanced/Custom).
2. En Metricool: **Configuración → tu perfil → API / Access token** (o pedilo a
   soporte de Metricool si no lo ves). Copiá el **User Token**.

## Paso 2 — Cargar el token

**Producción (Cloudflare):**
```bash
npx wrangler secret put METRICOOL_USER_TOKEN
```
`METRICOOL_USER_ID` y `METRICOOL_BLOG_ID` ya están en `wrangler.toml`.
`METRICOOL_NETWORKS` controla en qué redes postear (default
`instagram,facebook,tiktok`).

**Local:** completá `METRICOOL_USER_TOKEN` en `.dev.vars`.

## Paso 3 — Probar

1. Seteá `PUBLIC_BASE_URL` con el dominio del Worker (para que Metricool descargue
   la imagen).
2. Disparo manual:
   ```
   https://TU-DOMINIO/run-now?token=TU_RUN_TOKEN
   ```
3. Mirá `/queue`: si `metricool(instagram+facebook+tiktok)` figura como
   `programado/publicado`, funcionó. Revisá también el planificador de Metricool.

---

## Notas

- **Prioridad:** si `METRICOOL_USER_TOKEN` está seteado, el motor publica **solo
  por Metricool** (no usa las APIs directas de Meta/TikTok, para no duplicar).
- **Validación del contrato:** el módulo llama al scheduler de Metricool según su
  API documentada. Si la primera prueba devuelve un error de formato, mandámelo
  (aparece en `/queue`) y ajusto los campos.
- **Ventaja:** no dependés de la revisión de Meta ni de la auditoría de TikTok;
  Metricool ya tiene los permisos de tus cuentas.
