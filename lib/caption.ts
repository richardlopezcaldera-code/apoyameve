import { BRAND } from "./brand";
import { formatCLP, discountPercent } from "./format";
import type { Product } from "./jumpseller";

// Texto (caption) para la publicación en redes.
export function caption(p: Product): string {
  const pct = discountPercent(p.price, p.compareAtPrice);
  const price = p.quotable
    ? "Consultá el precio por WhatsApp 📲"
    : pct
      ? `Antes ${formatCLP(p.compareAtPrice!)} · Ahora ${formatCLP(p.price)} (-${pct}%)`
      : `Precio: ${formatCLP(p.price)}`;
  const catTag = p.category ? `#${p.category.replace(/\s+/g, "")} ` : "";
  return [
    `✨ ${p.name}`,
    price,
    BRAND.cta,
    `📲 WhatsApp ${BRAND.whatsapp}`,
    "",
    `${catTag}#MobiliarioTech #Muebles #Oficina #HomeOffice #Chile`,
  ].join("\n");
}
