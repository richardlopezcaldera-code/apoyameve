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

## 2. Diseño técnico (el "cómo")

### Stack
- **Next.js (App Router)** desplegado en **Vercel**.
- **Generación de imágenes:** `@vercel/og` (Satori) — plantillas HTML/CSS → PNG
  en el servidor.
- **Datos:** ruta de API interna (server-side) que llama a Jumpseller. El **token
  de Jumpseller vive como variable de entorno**, nunca en el navegador.

### Flujo
1. El usuario elige categoría o mira las sugerencias.
2. El sistema trae esos productos de Jumpseller.
3. El usuario elige formato (post / historia / catálogo).
4. Vista previa de la pieza con la marca.
5. Descarga el PNG (individual o en lote).

### Detalles de ingeniería a resolver en el build (no bloquean el diseño)
- **Colores y tipografía de marca:** `@vercel/og` necesita fuente embebida; definir
  la paleta exacta (el logo la sugiere).
- **Fotos remotas:** las imágenes de Jumpseller (`images.jumpseller.com`) son
  públicas; `@vercel/og` puede traerlas directo.
- **Descarga en lote:** definir si es un `.zip`.
- **Caché de productos:** live fetch para empezar; cachear después si hace falta.
- **Límites de Vercel** para generación de imágenes (verificar según el plan).

---

## 3. Próximos pasos
1. Scaffolding Next.js + configuración de Vercel y variable de entorno del token
   Jumpseller.
2. Ruta de API que lista productos por categoría y sugeridos.
3. Primera plantilla (post cuadrado 1080×1080) renderizando un producto real.
4. Plantillas de historia y catálogo.
5. Selección por categoría + sugerencias, vista previa y descarga.
