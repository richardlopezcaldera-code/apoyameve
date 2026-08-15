// Bloques de página reusables.
//
// Cada función devuelve una sección completa y recibe su contenido por
// parámetro. Para una landing nueva se importan los bloques que hagan falta,
// se les pasa el copy y se componen con `page()` — sin duplicar markup ni
// reajustar espaciados a mano.
//
// Convención: los bloques traen su propio ritmo vertical (`section-y`) y su
// propio contenedor (`wrap`), así se pueden reordenar libremente.

import { Icon, heroPanel, productPlaceholder, promoArt } from "./svg";
import { escapeHTML } from "./layout";

// ── Barra superior ────────────────────────────────────────────────────────

export function topbar(message: string): string {
  return `<div class="bg-ink text-on-ink text-[13px] tracking-[.02em]">
  <div class="wrap flex min-h-10 items-center justify-center gap-4 text-center">
    <button type="button" class="grid size-7 place-items-center rounded-pill text-beige/70 transition-opacity hover:text-beige" aria-label="Mensaje anterior">${Icon.chevronLeft({ size: 16, decorative: true })}</button>
    <span class="font-medium">${escapeHTML(message)}</span>
    <button type="button" class="grid size-7 place-items-center rounded-pill text-beige/70 transition-opacity hover:text-beige" aria-label="Mensaje siguiente">${Icon.chevronRight({ size: 16, decorative: true })}</button>
  </div>
</div>`;
}

// ── Header ────────────────────────────────────────────────────────────────

export type NavItem = { label: string; href: string; icon: keyof typeof Icon };

export function header(brand: { a: string; b: string }, nav: NavItem[]): string {
  const links = nav
    .map(
      (n) => `<a href="${escapeHTML(n.href)}" class="inline-flex items-center gap-2 rounded-sm px-1 py-2 text-[15px] font-semibold text-ink-soft transition-colors hover:text-rust">
      <span class="text-rust">${Icon[n.icon]({ size: 18, decorative: true })}</span>${escapeHTML(n.label)}</a>`,
    )
    .join("\n      ");

  return `<header class="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur-md">
  <div class="wrap flex min-h-19 items-center gap-4 lg:gap-7">
    <a href="/" class="inline-flex shrink-0 items-baseline gap-px text-2xl font-extrabold leading-none tracking-[-.02em] sm:text-3xl" aria-label="${escapeHTML(brand.a + brand.b)} — inicio">
      <span class="relative after:absolute after:inset-x-0 after:right-[22%] after:-bottom-1.5 after:h-1 after:rounded-sm after:bg-rust">${escapeHTML(brand.a)}</span><span class="text-rust">${escapeHTML(brand.b)}</span>
    </a>

    <nav class="hidden items-center gap-3 lg:flex lg:gap-6" aria-label="Principal">
      ${links}
    </nav>

    <div class="ml-auto flex shrink-0 items-center gap-3">
      <!-- Bajo md la búsqueda es un botón: la píldora completa no entra en 375
           junto a la marca, y encogerla dejaría un campo intocable. -->
      <button type="button" class="inline-flex items-center transition-colors hover:text-rust md:hidden" aria-label="Buscar productos">${Icon.search({ size: 22, decorative: true })}</button>
      <label class="hidden min-w-0 items-center gap-2.5 rounded-pill border border-line bg-card px-4 py-2.5 text-muted md:flex md:min-w-[min(320px,30vw)]">
        <span class="shrink-0">${Icon.search({ size: 18, decorative: true })}</span>
        <span class="sr-only">Buscar productos</span>
        <input type="search" placeholder="¿Qué estás buscando?" class="w-full border-0 bg-transparent font-[inherit] text-ink outline-none">
      </label>
      <button type="button" class="hidden items-center gap-1.5 text-sm font-semibold transition-colors hover:text-rust sm:inline-flex">
        ${Icon.user({ size: 20, decorative: true })}<span class="hidden lg:inline">Ingresar</span>
      </button>
      <button type="button" class="inline-flex items-center transition-colors hover:text-rust" aria-label="Carrito de compras">${Icon.cart({ size: 22, decorative: true })}</button>
      <button type="button" class="inline-flex items-center transition-colors hover:text-rust lg:hidden" aria-label="Abrir menú">${Icon.menu({ size: 22, decorative: true })}</button>
    </div>
  </div>
</header>`;
}

// ── Hero ──────────────────────────────────────────────────────────────────

export type HeroOptions = {
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
  /** Etiquetas sobre los paneles laterales. */
  tags?: [string, string];
};

/**
 * Clases completas por color. Tailwind escanea el fuente como texto plano: una
 * clase armada con interpolación (`bg-${c}`) nunca aparece en el CSS. El mapa
 * mantiene cada token entero y visible para el scanner.
 */
const DOT_BG = {
  rust: "bg-rust",
  blue: "bg-blue",
  mustard: "bg-mustard",
  green: "bg-green",
} as const;

export function hero(o: HeroOptions): string {
  // Los puntos viven en los tercios exteriores (fuera del 30–70% horizontal),
  // que es donde va la columna de texto: encima del titular restan
  // legibilidad. Y se ocultan bajo `md`, donde el texto ocupa todo el ancho y
  // no queda banda libre — son decorativos, no informativos.
  const dots = (
    [
      [26, "rust", "14%", "4%"],
      [20, "blue", "30%", "1.5%"],
      [22, "green", "66%", "8%"],
      [18, "rust", "84%", "3%"],
      [24, "mustard", "48%", "22%"],
      [30, "blue", "20%", "92%"],
      [26, "mustard", "44%", "96%"],
      [22, "green", "72%", "86%"],
      [20, "rust", "12%", "78%"],
      [24, "blue", "58%", "74%"],
    ] as const
  )
    .map(
      ([size, c, top, left]) =>
        `<span class="dot ${DOT_BG[c]} hidden md:block" style="width:${size}px;height:${size}px;top:${top};left:${left}"></span>`,
    )
    .join("");

  const panel = (side: "left" | "right", tag?: string) =>
    `<div class="relative min-h-50 md:min-h-80">${heroPanel(side, side)}
      ${tag ? `<span class="absolute bottom-3.5 left-3.5 rounded-pill bg-ink/55 px-2.5 py-1 text-[11px] uppercase tracking-[.06em] text-on-ink">${escapeHTML(tag)}</span>` : ""}
    </div>`;

  return `<section class="relative overflow-hidden bg-cream2">
  ${dots}
  <div class="relative z-2 grid items-stretch md:min-h-[min(76vh,640px)] md:grid-cols-[1fr_1.15fr_1fr]">
    <div class="order-2 hidden md:order-none md:block">${panel("left", o.tags?.[0])}</div>

    <div class="order-1 flex flex-col items-center justify-center gap-5 bg-cream px-7 py-11 text-center md:order-none md:px-7 md:py-12">
      <h1 class="font-display text-[clamp(52px,8vw,104px)] font-bold leading-[.9] text-ink">${escapeHTML(o.title)}</h1>
      <p class="max-w-[30ch] text-[clamp(14px,1.5vw,18px)] font-semibold text-ink-soft">${escapeHTML(o.subtitle)}</p>
      <a href="${escapeHTML(o.cta.href)}" class="press inline-flex items-center gap-2 rounded-sm bg-ink px-7 py-4 font-bold tracking-[.02em] text-on-ink transition-colors hover:bg-rust">
        ${escapeHTML(o.cta.label)}${Icon.arrowRight({ size: 18, decorative: true })}
      </a>
    </div>

    <div class="order-3 md:order-none">${panel("right", o.tags?.[1])}</div>
  </div>
</section>`;
}

// ── Encabezado de sección ─────────────────────────────────────────────────

function sectionHead(eyebrow: string, title: string, lead?: string): string {
  return `<p class="mb-2 text-xs font-bold uppercase tracking-[.16em] text-rust-ink">${escapeHTML(eyebrow)}</p>
  <h2 class="text-[clamp(26px,3.4vw,40px)] font-extrabold tracking-[-.02em]">${escapeHTML(title)}</h2>
  ${lead ? `<p class="mt-2.5 max-w-[52ch] text-muted">${escapeHTML(lead)}</p>` : ""}`;
}

// ── Categorías ────────────────────────────────────────────────────────────

export type Category = { name: string; note: string; swatch: string };

export function categories(id: string, head: { eyebrow: string; title: string; lead?: string }, items: Category[]): string {
  const cards = items
    .map(
      (c) => `<a href="#" class="lift reveal flex flex-col gap-2.5 rounded-md border border-line bg-card p-5">
      <span class="size-10 rounded-md" style="background:${escapeHTML(c.swatch)}"></span>
      <b class="text-base">${escapeHTML(c.name)}</b>
      <span class="text-[13px] text-muted">${escapeHTML(c.note)}</span>
    </a>`,
    )
    .join("\n    ");

  return `<section id="${escapeHTML(id)}" class="section-y">
  <div class="wrap">
    ${sectionHead(head.eyebrow, head.title, head.lead)}
    <div class="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
    ${cards}
    </div>
  </div>
</section>`;
}

// ── Grilla de productos ───────────────────────────────────────────────────

export type Product = {
  name: string;
  category: string;
  price: string;
  was?: string;
  badge?: string;
};

export function products(
  id: string,
  head: { eyebrow: string; title: string; more?: { label: string; href: string } },
  items: Product[],
): string {
  const cards = items
    .map(
      (p, i) => `<article class="lift reveal flex flex-col overflow-hidden rounded-md border border-line bg-card">
      <div class="relative grid aspect-[4/3] place-items-center bg-cream2 text-ink">
        ${productPlaceholder(i, `${p.name} — imagen pendiente`)}
        ${p.badge ? `<span class="absolute left-2.5 top-2.5 rounded-pill bg-rust px-2.5 py-1 text-xs font-extrabold text-white">${escapeHTML(p.badge)}</span>` : ""}
      </div>
      <div class="flex flex-col gap-1.5 p-4">
        <p class="text-xs font-bold uppercase tracking-[.04em] text-rust-ink">${escapeHTML(p.category)}</p>
        <h3 class="text-[15.5px] font-bold leading-tight">${escapeHTML(p.name)}</h3>
        <!-- flex-wrap es necesario, no decorativo: en grilla de 2 columnas a
             375px el precio actual y el tachado no entran en la misma línea y
             desbordaban el documento. Al envolver, el tachado baja solo. -->
        <p class="mt-1 flex flex-wrap items-baseline gap-x-2.5 tabular-nums">
          <span class="text-[20px] font-extrabold sm:text-[22px]">${escapeHTML(p.price)}</span>
          ${p.was ? `<span class="text-sm text-muted line-through">${escapeHTML(p.was)}</span>` : ""}
        </p>
        <button type="button" class="press mt-2.5 self-start rounded-sm bg-ink px-4 py-2.5 text-[13px] font-bold text-on-ink transition-colors hover:bg-rust">Agregar</button>
      </div>
    </article>`,
    )
    .join("\n    ");

  return `<section id="${escapeHTML(id)}" class="section-y">
  <div class="wrap">
    <div class="flex flex-wrap items-end justify-between gap-5">
      <div>${sectionHead(head.eyebrow, head.title)}</div>
      ${head.more ? `<a href="${escapeHTML(head.more.href)}" class="border-b-2 border-rust pb-0.5 font-bold text-rust-ink">${escapeHTML(head.more.label)}</a>` : ""}
    </div>
    <div class="mt-7 grid grid-cols-2 gap-5 lg:grid-cols-4">
    ${cards}
    </div>
  </div>
</section>`;
}

// ── Franja de beneficios ──────────────────────────────────────────────────

export type Benefit = { icon: keyof typeof Icon; title: string; note: string };

export function benefits(items: Benefit[]): string {
  const cells = items
    .map(
      (b) => `<div class="reveal flex items-start gap-3.5">
      <span class="grid size-11 shrink-0 place-items-center rounded-md bg-rust/10 text-rust">${Icon[b.icon]({ size: 22, decorative: true })}</span>
      <div>
        <b class="block text-[15px]">${escapeHTML(b.title)}</b>
        <span class="text-[13px] text-muted">${escapeHTML(b.note)}</span>
      </div>
    </div>`,
    )
    .join("\n    ");

  return `<section class="border-y border-line bg-card">
  <div class="wrap grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
    ${cells}
  </div>
</section>`;
}

// ── Banda promocional ─────────────────────────────────────────────────────

export function promo(o: { title: string; text: string; cta: { label: string; href: string } }): string {
  return `<section class="section-y">
  <div class="wrap">
    <div class="grid items-center gap-6 rounded-lg bg-rust p-7 text-on-rust md:grid-cols-[1.4fr_1fr] md:p-11">
      <div class="order-2 md:order-none">
        <h2 class="text-[clamp(24px,3vw,38px)] font-extrabold">${escapeHTML(o.title)}</h2>
        <p class="mt-3 max-w-[46ch] opacity-90">${escapeHTML(o.text)}</p>
        <a href="${escapeHTML(o.cta.href)}" class="press mt-5 inline-flex items-center gap-2 rounded-sm bg-on-rust px-7 py-4 font-bold text-rust-ink transition-colors hover:bg-mustard hover:text-ink">
          ${escapeHTML(o.cta.label)}${Icon.arrowRight({ size: 18, decorative: true })}
        </a>
      </div>
      <div class="order-1 md:order-none">${promoArt()}</div>
    </div>
  </div>
</section>`;
}

// ── Footer ────────────────────────────────────────────────────────────────

export type FooterColumn = { title: string; links: { label: string; href: string }[] };

export function footer(
  brand: { a: string; b: string },
  columns: FooterColumn[],
  contact: { whatsapp: string; legal: string },
): string {
  const cols = columns
    .map(
      (c) => `<div>
      <h4 class="mb-3.5 text-[13px] uppercase tracking-[.1em] text-on-ink">${escapeHTML(c.title)}</h4>
      ${c.links.map((l) => `<a href="${escapeHTML(l.href)}" class="block py-1 text-sm text-beige/80 transition-colors hover:text-mustard">${escapeHTML(l.label)}</a>`).join("\n      ")}
    </div>`,
    )
    .join("\n    ");

  return `<footer class="mt-5 bg-ink text-beige/80">
  <div class="wrap grid grid-cols-2 gap-7 py-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
    <div class="col-span-2 lg:col-span-1">
      <p class="inline-flex items-baseline gap-px text-3xl font-extrabold leading-none tracking-[-.02em] text-on-ink">
        <span class="relative after:absolute after:inset-x-0 after:right-[22%] after:-bottom-1.5 after:h-1 after:rounded-sm after:bg-rust">${escapeHTML(brand.a)}</span><span class="text-rust">${escapeHTML(brand.b)}</span>
      </p>
      <a href="https://wa.me/${escapeHTML(contact.whatsapp.replace(/[^0-9]/g, ""))}" class="mt-4 inline-flex items-center gap-2 font-bold text-mustard transition-opacity hover:opacity-80">
        ${Icon.whatsapp({ size: 20, decorative: true })}${escapeHTML(contact.whatsapp)}
      </a>
    </div>
    ${cols}
  </div>
  <p class="wrap border-t border-white/10 py-4 text-center text-[12.5px] text-muted">${escapeHTML(contact.legal)}</p>
</footer>`;
}
