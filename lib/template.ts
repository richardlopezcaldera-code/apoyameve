import { BRAND } from "./brand";
import { formatCLP, discountPercent } from "./format";
import type { Product } from "./jumpseller";

// Plantilla del post cuadrado 1080x1080 como HTML (lo consume workers-og/Satori).
// Satori soporta un subconjunto de CSS: usar flex e inline styles.
export function squarePostHTML(product: Product): string {
  const c = BRAND.colors;
  const pct = discountPercent(product.price, product.compareAtPrice);
  const priceLabel = product.quotable ? "Consultar precio" : formatCLP(product.price);

  const categoryChip = product.category
    ? `<div style="display:flex;background:${c.primary};color:${c.light};font-size:30px;font-weight:700;padding:12px 28px;border-radius:999px;">${esc(product.category)}</div>`
    : `<div style="display:flex;"></div>`;

  const saleBadge = pct
    ? `<div style="position:absolute;top:10px;right:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;width:160px;height:160px;border-radius:999px;background:${c.sale};color:${c.light};">
         <div style="display:flex;font-size:60px;font-weight:800;">-${pct}%</div>
         <div style="display:flex;font-size:26px;font-weight:700;">OFERTA</div>
       </div>`
    : "";

  const image = product.imageUrl
    ? `<img src="${esc(product.imageUrl)}" style="max-width:620px;max-height:560px;object-fit:contain;" />`
    : `<div style="display:flex;font-size:40px;color:${c.muted};">Sin imagen</div>`;

  const compareAt =
    product.compareAtPrice && pct
      ? `<div style="display:flex;font-size:40px;color:${c.muted};text-decoration:line-through;margin-right:24px;">${formatCLP(product.compareAtPrice)}</div>`
      : "";

  return `
  <div style="width:1080px;height:1080px;display:flex;flex-direction:column;background:${c.light};font-family:sans-serif;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:44px 56px;">
      <img src="${esc(BRAND.logoUrl)}" height="70" style="object-fit:contain;" />
      ${categoryChip}
    </div>

    <div style="display:flex;flex:1;align-items:center;justify-content:center;padding:0 56px;position:relative;">
      ${image}
      ${saleBadge}
    </div>

    <div style="display:flex;flex-direction:column;padding:0 56px 20px;">
      <div style="display:flex;font-size:52px;font-weight:800;color:${c.dark};">${esc(product.name)}</div>
      <div style="display:flex;align-items:flex-end;margin-top:20px;">
        ${compareAt}
        <div style="display:flex;font-size:84px;font-weight:900;color:${product.quotable ? c.primary : c.dark};">${esc(priceLabel)}</div>
      </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;background:${c.primary};color:${c.light};padding:34px 56px;">
      <div style="display:flex;font-size:36px;font-weight:700;">${esc(BRAND.cta)}</div>
      <div style="display:flex;font-size:36px;font-weight:800;">${esc(BRAND.whatsapp)}</div>
    </div>
  </div>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
