# apoyameve — Generador de avisos MobiliarioTech

Genera piezas publicitarias (imágenes 1080×1080) de los productos de la tienda
**MobiliarioTech** (Jumpseller), con la marca aplicada, listas para postear.

Ver alcance y diseño en [`SPEC.md`](./SPEC.md).

## Stack

- **Cloudflare Workers** + **Hono** (router + UI)
- **[workers-og](https://github.com/kvnang/workers-og)** — genera la imagen (Satori) en el edge
- **Jumpseller API** — origen de los productos (server-side, token como secret)

## Estructura

```
src/index.ts       Worker: UI (/) e imagen del aviso (/og?id=<id>)
lib/jumpseller.ts  Cliente de la API de Jumpseller
lib/template.ts    Plantilla del post cuadrado 1080×1080 (HTML → Satori)
lib/brand.ts       Marca: logo, colores, WhatsApp, CTA
lib/format.ts      Formato de precio CLP y % de descuento
```

## Desarrollo local

```bash
npm install
cp .dev.vars.example .dev.vars   # y completá tus credenciales de Jumpseller
npm run dev                      # http://localhost:8787
```

Sin credenciales, la app muestra un producto de demostración para ver la plantilla.

## Deploy a Cloudflare

1. Instalar Wrangler y loguearse: `npx wrangler login`
2. Cargar los secretos (desde tu panel de Jumpseller → Cuenta → API):
   ```bash
   npx wrangler secret put JUMPSELLER_LOGIN
   npx wrangler secret put JUMPSELLER_AUTHTOKEN
   ```
3. Desplegar: `npm run deploy`

También se puede conectar el repo desde `dash.cloudflare.com` (Workers & Pages →
Create → Workers) y configurar los secrets ahí.

## Uso

- `/` — listado de productos; cada uno con botón **Ver aviso**. Los productos sin
  stock no son elegibles.
- `/og?id=<id>` — genera la imagen del aviso del producto.

## Estado

Prototipo: plantilla de **post cuadrado** funcionando. Próximo: historia vertical
(1080×1920), catálogo (varios productos), selección por categoría y descarga en lote.
