# Spec — Generador de avisos publicitarios · MobiliarioTech

Herramienta para **generar piezas publicitarias (imágenes) de los muebles de
MobiliarioTech** a partir de plantillas con la marca y las fotos reales del
producto. Sin IA generando imágenes. Los productos se leen desde Jumpseller.

Estado: **alcance y diseño técnico confirmados**. Pendiente: implementación.

---

## 1. Alcance (el "qué")

### Trabajo central
Generar avisos listos para postear (imágenes) usando **plantillas con la marca +
las fotos del producto**. El sistema **arma la pieza**; el posteo lo hace el
usuario manualmente.

### Fuente de datos
Tienda **Jumpseller** ("MobiliarioTech", mobiliariostechchile.cl, CLP) vía API.
Cada producto aporta: nombre, precio (CLP), fotos, categoría, marca, descripción,
descuento (`compare_at_price`) y stock. Identidad de marca: logo, colores y
WhatsApp (+56 9 6154 4423) desde los datos de la tienda.

### Formatos (3 plantillas)
1. **Post cuadrado** — 1080×1080 (feed Instagram/Facebook)
2. **Historia vertical** — 1080×1920 (Stories / estado de WhatsApp)
3. **Catálogo** — varios muebles en una sola pieza (ej. grilla de ofertas)

### Contenido de cada pieza
- Foto + nombre + precio
- Sello de descuento (precio tachado + % / "OFERTA") cuando hay `compare_at_price`
- Logo y colores de marca
- WhatsApp + llamada a la acción ("¡Consulta ya!" / "Despacho a todo Chile")

### Selección de productos
- **Por categoría** (ej. "Sillas", "Ofertas del Día")
- **Sugerencias del sistema** (destacados / en oferta)

### Salida
Solo **genera** la pieza (PNG descargable, individual o en lote). El usuario la postea.

### Reglas / casos borde
- **Sin stock** → no deja generar / avisa (no promocionar agotado).
- **"A cotizar"** (sin precio real) → muestra "Consultar precio" en vez del monto.
- **Descuento** → solo cuando existe `compare_at_price`.
- **Precio** → formato CLP ($56.990, sin decimales).

### Qué NO hace (anti-alcance)
- No publica ni se conecta a redes para postear.
- No genera imágenes con IA (solo plantillas).
- No gestiona pauta paga (Meta/Google Ads).
- No es multiusuario/SaaS para otros vendedores (por ahora).
- No carga productos a mano (vienen de Jumpseller).

### Usuarios
Herramienta personal: **un solo usuario** (el dueño del negocio), sin login.

---

## 2. Diseño técnico (el "cómo") — implementado

### Stack (hosting: Cloudflare)
- **Cloudflare Workers** + **Hono** (router y UI). Vercel quedó **desactivado**
  (`vercel.json` con `github.enabled=false`); Cloudflare es el hosting definitivo.
- **Generación de imágenes:** `workers-og` (Satori) — plantillas HTML/CSS → PNG
  en el edge.
- **Datos:** el Worker llama a la API de **Jumpseller** server-side. El token vive
  como **secret** de Cloudflare, nunca en el navegador.

### Rutas
- `/` — home pública (estilo de marca aprobado).
- `/generador` — herramienta interna: elegir producto, formato y descargar.
- `/og?id=<id>&format=post|story` — imagen del aviso.
- `/catalog?category=<id>` — pieza de catálogo (varios productos).
- `/batch?...&format=` — descarga en lote (.zip, con `fflate`).
- `/queue` — historial de publicaciones automáticas.
- `/run-now?token=` — disparo manual del motor (protegido con `RUN_TOKEN`).

### Publicación automática (3/día)
- **Cron Triggers de Cloudflare** (10:00, 14:00, 20:00 Chile) → handler `scheduled`.
- Elige un producto elegible (rota ofertas/destacados, saltea sin stock), arma la
  pieza (foto real, sin IA) y el caption, y publica.
- **Publicación vía Metricool** (integrador único IG + FB + TikTok) cuando está
  `METRICOOL_USER_TOKEN`; si no, cae a las APIs directas de Meta/TikTok.

### Secrets / variables
`JUMPSELLER_LOGIN`, `JUMPSELLER_AUTHTOKEN`, `METRICOOL_USER_TOKEN`
(+ `METRICOOL_USER_ID`/`BLOG_ID`/`NETWORKS`), y opcionales `IG_*`, `FB_*`,
`TIKTOK_ACCESS_TOKEN`, `PUBLIC_BASE_URL`, `RUN_TOKEN`. Guías en `docs/`.

---

## 3. Estado
Implementado en Cloudflare Workers y documentado. Para activar el posteo real
solo falta cargar `METRICOOL_USER_TOKEN` y `PUBLIC_BASE_URL`, y desplegar con
`npm run deploy`. Ver `README.md` y `docs/SETUP-*.md`.
