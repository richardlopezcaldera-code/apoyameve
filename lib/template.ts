import { BRAND } from "./brand";
import { formatCLP, discountPercent } from "./format";
import type { Product } from "./jumpseller";

const c = BRAND.colors;

export type Format = "post" | "story";

// ─── helpers ─────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function priceLabel(p: Product): string {
  return p.quotable ? "Consultar precio" : formatCLP(p.price);
}

function saleBadge(p: Product, size: number, top: number, right: number): string {
  const pct = discountPercent(p.price, p.compareAtPrice);
  if (!pct) return "";
  return `<div style="position:absolute;top:${top}px;right:${right}px;display:flex;flex-direction:column;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:999px;background:${c.sale};color:${c.light};">
    <div style="display:flex;font-size:${Math.round(size * 0.38)}px;font-weight:800;">-${pct}%</div>
    <div style="display:flex;font-size:${Math.round(size * 0.16)}px;font-weight:700;">OFERTA</div>
  </div>`;
}

function imageBox(p: Product, maxW: number, maxH: number): string {
  return p.imageUrl
    ? `<img src="${esc(p.imageUrl)}" style="max-width:${maxW}px;max-height:${maxH}px;object-fit:contain;" />`
    : `<div style="display:flex;font-size:40px;color:${c.muted};">Sin imagen</div>`;
}

function priceRow(p: Product, big: number): string {
  const pct = discountPercent(p.price, p.compareAtPrice);
  const compareAt =
    p.compareAtPrice && pct
      ? `<div style="display:flex;font-size:${Math.round(big * 0.48)}px;color:${c.muted};text-decoration:line-through;margin-right:24px;">${formatCLP(p.compareAtPrice)}</div>`
      : "";
  return `<div style="display:flex;align-items:flex-end;">
    ${compareAt}
    <div style="display:flex;font-size:${big}px;font-weight:900;color:${p.quotable ? c.primary : c.dark};">${esc(priceLabel(p))}</div>
  </div>`;
}

function header(padding: string): string {
  return `<div style="display:flex;align-items:center;justify-content:space-between;padding:${padding};">
    <img src="${esc(BRAND.logoUrl)}" height="70" style="object-fit:contain;" />
    <div style="display:flex;font-size:30px;font-weight:800;color:${c.primary};">${esc(BRAND.name)}</div>
  </div>`;
}

function ctaBar(padding: string, fontSize: number): string {
  return `<div style="display:flex;align-items:center;justify-content:space-between;background:${c.primary};color:${c.light};padding:${padding};">
    <div style="display:flex;font-size:${fontSize}px;font-weight:700;">${esc(BRAND.cta)}</div>
    <div style="display:flex;font-size:${fontSize}px;font-weight:800;">${esc(BRAND.whatsapp)}</div>
  </div>`;
}

// ─── post cuadrado 1080x1080 ─────────────────────────────────────────

export function squarePostHTML(p: Product): string {
  const chip = p.category
    ? `<div style="display:flex;background:${c.primary};color:${c.light};font-size:30px;font-weight:700;padding:12px 28px;border-radius:999px;">${esc(p.category)}</div>`
    : "";
  return `<div style="width:1080px;height:1080px;display:flex;flex-direction:column;background:${c.light};font-family:sans-serif;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:44px 56px;">
      <img src="${esc(BRAND.logoUrl)}" height="70" style="object-fit:contain;" />
      ${chip}
    </div>
    <div style="display:flex;flex:1;align-items:center;justify-content:center;padding:0 56px;position:relative;">
      ${imageBox(p, 620, 560)}
      ${saleBadge(p, 160, 10, 56)}
    </div>
    <div style="display:flex;flex-direction:column;padding:0 56px 20px;">
      <div style="display:flex;font-size:52px;font-weight:800;color:${c.dark};">${esc(p.name)}</div>
      <div style="display:flex;margin-top:20px;">${priceRow(p, 84)}</div>
    </div>
    ${ctaBar("34px 56px", 36)}
  </div>`;
}

// ─── historia vertical 1080x1920 ─────────────────────────────────────

export function storyHTML(p: Product): string {
  return `<div style="width:1080px;height:1920px;display:flex;flex-direction:column;background:${c.light};font-family:sans-serif;">
    ${header("70px 64px 20px")}
    <div style="display:flex;flex:1;align-items:center;justify-content:center;padding:0 64px;position:relative;">
      ${imageBox(p, 820, 900)}
      ${saleBadge(p, 220, 20, 64)}
    </div>
    <div style="display:flex;flex-direction:column;padding:0 64px 40px;">
      ${p.category ? `<div style="display:flex;font-size:34px;font-weight:700;color:${c.primary};margin-bottom:12px;">${esc(p.category)}</div>` : ""}
      <div style="display:flex;font-size:68px;font-weight:800;color:${c.dark};">${esc(p.name)}</div>
      <div style="display:flex;margin-top:28px;">${priceRow(p, 108)}</div>
    </div>
    ${ctaBar("48px 64px", 42)}
  </div>`;
}

// ─── catálogo (varios productos) 1080x1350 ───────────────────────────

export function catalogHTML(products: Product[], title = "Ofertas"): string {
  const items = products.slice(0, 4);
  const cells = items
    .map(
      (p) => `<div style="display:flex;flex-direction:column;width:440px;padding:18px;">
        <div style="display:flex;height:300px;align-items:center;justify-content:center;position:relative;">
          ${imageBox(p, 400, 300)}
          ${saleBadge(p, 96, 0, 0)}
        </div>
        <div style="display:flex;font-size:30px;font-weight:700;color:${c.dark};margin-top:12px;">${esc(p.name)}</div>
        <div style="display:flex;font-size:40px;font-weight:900;color:${p.quotable ? c.primary : c.dark};margin-top:6px;">${esc(priceLabel(p))}</div>
      </div>`,
    )
    .join("");

  return `<div style="width:1080px;height:1350px;display:flex;flex-direction:column;background:${c.light};font-family:sans-serif;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:44px 56px;">
      <img src="${esc(BRAND.logoUrl)}" height="70" style="object-fit:contain;" />
      <div style="display:flex;font-size:52px;font-weight:900;color:${c.primary};">${esc(title)}</div>
    </div>
    <div style="display:flex;flex:1;flex-wrap:wrap;align-content:center;justify-content:center;padding:0 40px;">
      ${cells}
    </div>
    ${ctaBar("34px 56px", 36)}
  </div>`;
}
