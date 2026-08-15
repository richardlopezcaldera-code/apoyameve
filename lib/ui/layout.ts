// Shell del documento. Toda página del sitio se arma con `page()`, de modo
// que el <head>, las fuentes, la hoja de estilos y el script de reveal se
// definen una sola vez y no se van desincronizando entre landings.

import { STYLES } from "./styles.generated";

export type PageOptions = {
  title: string;
  description: string;
  /** Bloques ya renderizados, en orden. */
  body: string;
  /** Idioma del documento. */
  lang?: string;
  /** URL canónica absoluta, si se conoce. */
  canonical?: string;
};

export function page(o: PageOptions): string {
  return `<!doctype html>
<html lang="${o.lang ?? "es"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHTML(o.title)}</title>
<meta name="description" content="${escapeHTML(o.description)}">
${o.canonical ? `<link rel="canonical" href="${escapeHTML(o.canonical)}">` : ""}
<meta property="og:title" content="${escapeHTML(o.title)}">
<meta property="og:description" content="${escapeHTML(o.description)}">
<meta property="og:type" content="website">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Caveat:wght@600;700&display=swap">

<style>${STYLES}</style>
</head>
<body>
<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-on-ink">Saltar al contenido</a>
${o.body}
${REVEAL_SCRIPT}
</body>
</html>`;
}

/**
 * Reveal progresivo al hacer scroll.
 *
 * Marca `html.js` antes de pintar para que el estado inicial oculto sólo
 * exista si el script corrió: sin JS el contenido se ve normal en vez de
 * quedar invisible para siempre. El delay escalonado se calcula por posición
 * dentro del grupo, tope de 6 pasos para que el último item de una grilla
 * larga no espere medio segundo.
 */
const REVEAL_SCRIPT = `<script>
(function () {
  var root = document.documentElement;
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  root.classList.add("js");

  var STEP = 60, MAX = 6;
  var pending = [].slice.call(document.querySelectorAll(".reveal"));

  function show(el) {
    var i = pending.indexOf(el);
    if (i === -1) return;
    pending.splice(i, 1);
    var sibs = el.parentElement ? [].slice.call(el.parentElement.children) : [el];
    el.style.setProperty("--reveal-delay", (Math.min(sibs.indexOf(el), MAX) * STEP) + "ms");
    el.classList.add("is-in");
    io.unobserve(el);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) show(e.target); });
  }, { rootMargin: "0px 0px -5% 0px", threshold: 0 });

  pending.forEach(function (el) { io.observe(el); });

  // Red de seguridad. El observer puede no alcanzar a disparar con scroll muy
  // rápido, un salto por ancla o una restauración de posición, y un elemento
  // que quedó en opacity:0 es contenido perdido, no una animación perdida.
  // Este barrido revela cualquier cosa que ya pasó por el viewport.
  var ticking = false;
  function sweep() {
    ticking = false;
    var limit = window.innerHeight + 100;
    pending.slice().forEach(function (el) {
      if (el.getBoundingClientRect().top < limit) show(el);
    });
    if (!pending.length) {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    }
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(sweep);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  sweep();
})();
</script>`;

export function escapeHTML(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
