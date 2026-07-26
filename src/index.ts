import { Hono } from "hono";
import { ImageResponse } from "workers-og";
import { listProducts, getProduct, type Product, type Credentials } from "../lib/jumpseller";
import { squarePostHTML } from "../lib/template";
import { BRAND } from "../lib/brand";
import { formatCLP } from "../lib/format";

type Bindings = {
  JUMPSELLER_LOGIN?: string;
  JUMPSELLER_AUTHTOKEN?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Producto de demostración: permite ver la plantilla antes de cargar el token.
const DEMO: Product = {
  id: 0,
  name: "Sillón de Oficina KM 5050",
  price: 56990,
  compareAtPrice: 79990,
  currency: "CLP",
  imageUrl:
    "https://images.jumpseller.com/store/mobiliariotech/34790052/Silla-Mobitech-productos_Tienda_MobiliariosTechChile.jpg",
  category: "Sillas",
  inStock: true,
  quotable: false,
  permalink: "sillon-de-oficina-km-5050",
};

function creds(env: Bindings): Credentials | null {
  if (env.JUMPSELLER_LOGIN && env.JUMPSELLER_AUTHTOKEN) {
    return { login: env.JUMPSELLER_LOGIN, authtoken: env.JUMPSELLER_AUTHTOKEN };
  }
  return null;
}

// Imagen del aviso (post cuadrado 1080x1080).
app.get("/og", async (c) => {
  const id = c.req.query("id");
  const cr = creds(c.env);
  let product: Product;
  try {
    product = id && cr ? await getProduct(cr, Number(id)) : DEMO;
  } catch (e) {
    return c.text(`Error trayendo el producto: ${(e as Error).message}`, 502);
  }
  return new ImageResponse(squarePostHTML(product), { width: 1080, height: 1080 });
});

// UI: elegir un producto y ver / descargar su aviso.
app.get("/", async (c) => {
  const cr = creds(c.env);
  let products: Product[] = [];
  let notice = "";

  if (cr) {
    try {
      products = await listProducts(cr, 50);
    } catch (e) {
      notice = `No se pudieron traer los productos: ${(e as Error).message}`;
    }
  } else {
    notice =
      "Todavía no está configurado el token de Jumpseller. Se muestra un producto de demostración. " +
      "Cargá los secretos JUMPSELLER_LOGIN y JUMPSELLER_AUTHTOKEN para ver tu catálogo real.";
    products = [DEMO];
  }

  return c.html(page(products, notice));
});

function page(products: Product[], notice: string): string {
  const cards = products
    .map((p) => {
      const eligible = p.inStock || p.quotable;
      const price = p.quotable ? "Consultar precio" : formatCLP(p.price);
      const badge = !p.inStock && !p.quotable
        ? `<span style="color:#e11d48;font-weight:700;">Sin stock</span>`
        : `<span style="color:#334155;">${price}</span>`;
      const action = eligible
        ? `<a href="/og?id=${p.id}" target="_blank" style="display:inline-block;margin-top:10px;padding:8px 14px;background:${BRAND.colors.primary};color:#fff;border-radius:8px;text-decoration:none;font-size:14px;">Ver aviso</a>`
        : `<span style="display:inline-block;margin-top:10px;font-size:13px;color:#94a3b8;">No elegible (sin stock)</span>`;
      const img = p.imageUrl
        ? `<img src="${p.imageUrl}" style="width:100%;height:150px;object-fit:contain;background:#f8fafc;border-radius:8px;" />`
        : `<div style="height:150px;background:#f1f5f9;border-radius:8px;"></div>`;
      return `<div style="border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#fff;">
        ${img}
        <div style="margin-top:10px;font-weight:600;font-size:15px;line-height:1.3;">${p.name}</div>
        <div style="margin-top:6px;font-size:14px;">${badge}</div>
        ${action}
      </div>`;
    })
    .join("");

  const noticeHTML = notice
    ? `<div style="background:#fef9c3;border:1px solid #fde047;color:#713f12;padding:12px 16px;border-radius:10px;margin-bottom:20px;font-size:14px;">${notice}</div>`
    : "";

  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Avisos ${BRAND.name}</title>
</head>
<body style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f4f5;color:#18181b;">
  <header style="background:${BRAND.colors.primary};color:#fff;padding:20px 24px;">
    <div style="font-size:20px;font-weight:800;">Generador de avisos · ${BRAND.name}</div>
    <div style="font-size:13px;opacity:.9;">Elegí un producto y generá su pieza para redes (1080×1080).</div>
  </header>
  <main style="max-width:1000px;margin:0 auto;padding:24px;">
    ${noticeHTML}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
      ${cards}
    </div>
  </main>
</body></html>`;
}

export default app;
