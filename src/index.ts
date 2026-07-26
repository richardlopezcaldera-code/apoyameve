import { Hono } from "hono";
import { ImageResponse } from "workers-og";
import { zipSync } from "fflate";
import {
  listProducts,
  listCategories,
  listProductsByCategory,
  getProduct,
  suggested,
  type Product,
  type Category,
  type Credentials,
} from "../lib/jumpseller";
import { squarePostHTML, storyHTML, catalogHTML, type Format } from "../lib/template";
import { BRAND } from "../lib/brand";
import { formatCLP } from "../lib/format";

type Bindings = {
  JUMPSELLER_LOGIN?: string;
  JUMPSELLER_AUTHTOKEN?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Datos de demostración para ver las plantillas sin token configurado.
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
  featured: true,
  permalink: "sillon-de-oficina-km-5050",
};
const DEMO_LIST: Product[] = [
  DEMO,
  { ...DEMO, id: 1, name: "Silla Ergonómica KM 3035", price: 42990, compareAtPrice: 59990 },
  { ...DEMO, id: 2, name: "Escritorio Home Office", price: 89990, compareAtPrice: null, featured: false },
];

function creds(env: Bindings): Credentials | null {
  if (env.JUMPSELLER_LOGIN && env.JUMPSELLER_AUTHTOKEN) {
    return { login: env.JUMPSELLER_LOGIN, authtoken: env.JUMPSELLER_AUTHTOKEN };
  }
  return null;
}

function pngFor(product: Product, format: Format): ImageResponse {
  return format === "story"
    ? new ImageResponse(storyHTML(product), { width: 1080, height: 1920 })
    : new ImageResponse(squarePostHTML(product), { width: 1080, height: 1080 });
}

async function pngBytes(product: Product, format: Format): Promise<Uint8Array> {
  return new Uint8Array(await pngFor(product, format).arrayBuffer());
}

// Imagen de un producto: /og?id=<id>&format=post|story
app.get("/og", async (c) => {
  const id = c.req.query("id");
  const format = (c.req.query("format") === "story" ? "story" : "post") as Format;
  const cr = creds(c.env);
  let product: Product;
  try {
    product = id && cr ? await getProduct(cr, Number(id)) : DEMO;
  } catch (e) {
    return c.text(`Error trayendo el producto: ${(e as Error).message}`, 502);
  }
  return pngFor(product, format);
});

// Catálogo (varios productos): /catalog?category=<id>
app.get("/catalog", async (c) => {
  const cr = creds(c.env);
  const cat = c.req.query("category");
  let products: Product[];
  let title = "Ofertas";
  try {
    if (cr) {
      products = cat ? await listProductsByCategory(cr, Number(cat)) : await listProducts(cr);
      const sug = suggested(products);
      products = (sug.length ? sug : products).filter((p) => p.inStock || p.quotable);
    } else {
      products = DEMO_LIST;
    }
  } catch (e) {
    return c.text(`Error armando el catálogo: ${(e as Error).message}`, 502);
  }
  return new ImageResponse(catalogHTML(products, title), { width: 1080, height: 1350 });
});

// Descarga en lote: /batch?category=<id>&format=post|story  -> .zip de PNGs
app.get("/batch", async (c) => {
  const format = (c.req.query("format") === "story" ? "story" : "post") as Format;
  const cat = c.req.query("category");
  const cr = creds(c.env);
  let products: Product[];
  try {
    if (cr) {
      products = cat ? await listProductsByCategory(cr, Number(cat)) : await listProducts(cr);
    } else {
      products = DEMO_LIST;
    }
  } catch (e) {
    return c.text(`Error: ${(e as Error).message}`, 502);
  }

  const eligible = products.filter((p) => p.inStock || p.quotable).slice(0, 12);
  if (!eligible.length) return c.text("No hay productos elegibles para el lote.", 404);

  const files: Record<string, Uint8Array> = {};
  for (const p of eligible) {
    try {
      files[`${p.permalink || p.id}-${format}.png`] = await pngBytes(p, format);
    } catch {
      // Si un producto falla (imagen inaccesible, etc.), se salta y sigue.
    }
  }
  if (!Object.keys(files).length) {
    return c.text("No se pudo generar ninguna pieza del lote.", 502);
  }

  const zip = zipSync(files, { level: 0 });
  return new Response(zip, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="avisos-${format}.zip"`,
    },
  });
});

// UI
app.get("/", async (c) => {
  const cr = creds(c.env);
  const cat = c.req.query("category");
  let products: Product[] = [];
  let categories: Category[] = [];
  let notice = "";

  if (cr) {
    try {
      [products, categories] = await Promise.all([
        cat ? listProductsByCategory(cr, Number(cat)) : listProducts(cr, 50),
        listCategories(cr),
      ]);
    } catch (e) {
      notice = `No se pudieron traer los datos: ${(e as Error).message}`;
    }
  } else {
    notice =
      "Todavía no está configurado el token de Jumpseller. Se muestran datos de demostración. " +
      "Cargá los secretos JUMPSELLER_LOGIN y JUMPSELLER_AUTHTOKEN para ver tu catálogo real.";
    products = DEMO_LIST;
  }

  return c.html(page(products, categories, notice, cat));
});

function page(
  products: Product[],
  categories: Category[],
  notice: string,
  activeCat?: string,
): string {
  const sug = suggested(products);

  const catLinks = [
    `<a href="/" style="${chip(!activeCat)}">Todos</a>`,
    ...categories.map(
      (cat) =>
        `<a href="/?category=${cat.id}" style="${chip(activeCat === String(cat.id))}">${cat.name}</a>`,
    ),
  ].join("");

  const q = activeCat ? `category=${activeCat}&` : "";
  const catalogHref = activeCat ? `/catalog?category=${activeCat}` : "/catalog";
  const batchPost = `/batch?${q}format=post`;
  const batchStory = `/batch?${q}format=story`;

  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Avisos ${BRAND.name}</title>
</head>
<body style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f4f5;color:#18181b;">
  <header style="background:${BRAND.colors.primary};color:#fff;padding:20px 24px;">
    <div style="font-size:20px;font-weight:800;">Generador de avisos · ${BRAND.name}</div>
    <div style="font-size:13px;opacity:.9;">Elegí un producto y generá su pieza (post, historia o catálogo).</div>
  </header>
  <main style="max-width:1040px;margin:0 auto;padding:24px;">
    ${notice ? `<div style="background:#fef9c3;border:1px solid #fde047;color:#713f12;padding:12px 16px;border-radius:10px;margin-bottom:20px;font-size:14px;">${notice}</div>` : ""}

    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">${catLinks}</div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <div style="font-weight:700;">${sug.length ? `Sugeridos (${sug.length} en oferta/destacados)` : "Productos"}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <a href="${catalogHref}" target="_blank" style="padding:8px 14px;background:${BRAND.colors.dark};color:#fff;border-radius:8px;text-decoration:none;font-size:14px;">Catálogo</a>
        <a href="${batchPost}" style="padding:8px 14px;background:#fff;border:1px solid ${BRAND.colors.dark};color:${BRAND.colors.dark};border-radius:8px;text-decoration:none;font-size:14px;">Lote posts (.zip)</a>
        <a href="${batchStory}" style="padding:8px 14px;background:#fff;border:1px solid ${BRAND.colors.dark};color:${BRAND.colors.dark};border-radius:8px;text-decoration:none;font-size:14px;">Lote historias (.zip)</a>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;">
      ${products.map(card).join("")}
    </div>
  </main>
</body></html>`;
}

function chip(active: boolean): string {
  return active
    ? `display:inline-block;padding:7px 14px;border-radius:999px;background:${BRAND.colors.primary};color:#fff;text-decoration:none;font-size:13px;font-weight:600;`
    : `display:inline-block;padding:7px 14px;border-radius:999px;background:#fff;border:1px solid #e2e8f0;color:#334155;text-decoration:none;font-size:13px;`;
}

function card(p: Product): string {
  const eligible = p.inStock || p.quotable;
  const price = p.quotable ? "Consultar precio" : formatCLP(p.price);
  const onSale = p.compareAtPrice != null && p.compareAtPrice > p.price;
  const status = !eligible
    ? `<span style="color:#e11d48;font-weight:700;">Sin stock</span>`
    : `<span style="color:#334155;">${price}</span>${onSale ? ` <span style="color:#e11d48;font-weight:700;">OFERTA</span>` : ""}`;
  const img = p.imageUrl
    ? `<img src="${p.imageUrl}" style="width:100%;height:150px;object-fit:contain;background:#f8fafc;border-radius:8px;" />`
    : `<div style="height:150px;background:#f1f5f9;border-radius:8px;"></div>`;
  const actions = eligible
    ? `<div style="display:flex;gap:8px;margin-top:10px;">
         <a href="/og?id=${p.id}&format=post" target="_blank" style="flex:1;text-align:center;padding:8px;background:${BRAND.colors.primary};color:#fff;border-radius:8px;text-decoration:none;font-size:13px;">Post</a>
         <a href="/og?id=${p.id}&format=story" target="_blank" style="flex:1;text-align:center;padding:8px;background:#fff;border:1px solid ${BRAND.colors.primary};color:${BRAND.colors.primary};border-radius:8px;text-decoration:none;font-size:13px;">Historia</a>
       </div>`
    : `<div style="margin-top:10px;font-size:13px;color:#94a3b8;">No elegible (sin stock)</div>`;
  return `<div style="border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#fff;">
    ${img}
    <div style="margin-top:10px;font-weight:600;font-size:15px;line-height:1.3;">${p.name}</div>
    <div style="margin-top:6px;font-size:14px;">${status}</div>
    ${actions}
  </div>`;
}

export default app;
