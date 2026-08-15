// Gráficos e iconos vectoriales.
//
// Todo es SVG inline por dos motivos: no depende de ningún asset externo (el
// Worker no sirve estáticos) y hereda el color del contexto vía
// `currentColor`, así que sigue a los tokens sin duplicar la paleta.
//
// Los iconos son de trazo, 1.75px, 24×24 — una sola familia visual. No se
// usan emojis como iconos: dependen de la fuente del sistema, cambian de
// forma entre plataformas y no se pueden tematizar.

// ── Iconos ────────────────────────────────────────────────────────────────

type IconProps = {
  /** Tamaño en px. Por defecto 20, que alinea bien con texto de 15-16px. */
  size?: number;
  /** `true` si el icono va al lado de texto visible que ya dice lo mismo. */
  decorative?: boolean;
  /** Nombre accesible. Obligatorio si el icono va solo, sin texto. */
  label?: string;
  class?: string;
};

function icon(path: string, p: IconProps = {}): string {
  const size = p.size ?? 20;
  // Un icono decorativo se oculta del árbol de accesibilidad; uno que carga
  // significado necesita nombre. Es la misma pieza con dos semánticas.
  const a11y = p.decorative
    ? 'aria-hidden="true" focusable="false"'
    : `role="img" aria-label="${escapeAttr(p.label ?? "")}"`;

  return `<svg ${a11y} class="${p.class ?? ""}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

export const Icon = {
  grid: (p?: IconProps) =>
    icon(
      '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      p,
    ),
  sofa: (p?: IconProps) =>
    icon(
      '<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M2 13a2 2 0 0 1 4 0v3h12v-3a2 2 0 0 1 4 0v5H2z"/><path d="M6 11h12"/>',
      p,
    ),
  home: (p?: IconProps) =>
    icon('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>', p),
  tag: (p?: IconProps) =>
    icon(
      '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>',
      p,
    ),
  search: (p?: IconProps) => icon('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', p),
  user: (p?: IconProps) =>
    icon('<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>', p),
  cart: (p?: IconProps) =>
    icon(
      '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11L21 7H6"/>',
      p,
    ),
  menu: (p?: IconProps) => icon('<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>', p),
  truck: (p?: IconProps) =>
    icon(
      '<path d="M2 6h11v10H2z"/><path d="M13 9h4l3 3.5V16h-7z"/><circle cx="6" cy="18.5" r="1.6"/><circle cx="17" cy="18.5" r="1.6"/>',
      p,
    ),
  shield: (p?: IconProps) =>
    icon('<path d="M12 3 4.5 6v6c0 4.5 3 7.6 7.5 9 4.5-1.4 7.5-4.5 7.5-9V6z"/><path d="m9 12 2 2 4-4"/>', p),
  whatsapp: (p?: IconProps) =>
    icon(
      '<path d="M3.5 20.5 5 16.4A8 8 0 1 1 8 19.2z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.5 1-1l-1.5-.8-1 .8a4.6 4.6 0 0 1-2-2l.8-1L11 9.5c-.5 0-1 .4-1 1z" fill="currentColor" stroke="none"/>',
      p,
    ),
  arrowRight: (p?: IconProps) => icon('<path d="M5 12h13"/><path d="m13 6 6 6-6 6"/>', p),
  chevronLeft: (p?: IconProps) => icon('<path d="m14 6-6 6 6 6"/>', p),
  chevronRight: (p?: IconProps) => icon('<path d="m10 6 6 6-6 6"/>', p),
};

// ── Gráficos de relleno ───────────────────────────────────────────────────

/**
 * Silueta abstracta de mobiliario, para usar mientras no haya foto real.
 * `seed` elige una de las variantes de forma determinista, así una grilla no
 * repite el mismo dibujo pero el render sigue siendo estable entre requests.
 */
export function productPlaceholder(seed: number, alt = ""): string {
  const shapes = [
    // Sillón
    '<rect x="26" y="74" width="108" height="34" rx="10"/><rect x="18" y="60" width="20" height="42" rx="9"/><rect x="122" y="60" width="20" height="42" rx="9"/><rect x="38" y="44" width="84" height="34" rx="8"/>',
    // Mesa
    '<rect x="20" y="62" width="120" height="12" rx="6"/><rect x="32" y="74" width="9" height="38" rx="4"/><rect x="119" y="74" width="9" height="38" rx="4"/>',
    // Lámpara
    '<path d="M80 34 56 74h48z"/><rect x="76" y="74" width="8" height="36" rx="4"/><rect x="62" y="110" width="36" height="8" rx="4"/>',
    // Estantería
    '<rect x="34" y="36" width="92" height="80" rx="6"/><path d="M34 63h92M34 90h92"/>',
    // Silla
    '<rect x="52" y="34" width="56" height="42" rx="8"/><rect x="46" y="76" width="68" height="10" rx="5"/><rect x="52" y="86" width="8" height="28" rx="4"/><rect x="100" y="86" width="8" height="28" rx="4"/>',
  ];
  const shape = shapes[Math.abs(seed) % shapes.length];
  const a11y = alt
    ? `role="img" aria-label="${escapeAttr(alt)}"`
    : 'aria-hidden="true" focusable="false"';

  return `<svg ${a11y} class="h-full w-full" viewBox="0 0 160 130" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round" opacity=".38">${shape}</svg>`;
}

/**
 * Panel decorativo del hero. Gradiente cálido más formas sueltas; sustituye a
 * la foto ambiente hasta que existan las reales.
 */
export function heroPanel(variant: "left" | "right", id: string): string {
  const from = variant === "left" ? "#e7d3b6" : "#e4ccaa";
  const mid = variant === "left" ? "#cdb08a" : "#cbaa82";
  const to = variant === "left" ? "#b9986f" : "#b7946b";
  const cx = variant === "left" ? "30%" : "70%";

  return `<svg aria-hidden="true" focusable="false" class="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 500">
  <defs>
    <radialGradient id="g-${id}" cx="${cx}" cy="25%" r="95%">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="55%" stop-color="${mid}"/>
      <stop offset="100%" stop-color="${to}"/>
    </radialGradient>
  </defs>
  <rect width="400" height="500" fill="url(#g-${id})"/>
  <g fill="none" stroke="#8a6b46" stroke-width="2" opacity=".22">
    <circle cx="${variant === "left" ? 300 : 100}" cy="140" r="58"/>
    <rect x="${variant === "left" ? 60 : 210}" y="300" width="130" height="96" rx="12"/>
  </g>
</svg>`;
}

/** Bloque de color con formas, para la banda promocional. */
export function promoArt(): string {
  return `<svg aria-hidden="true" focusable="false" class="h-40 w-full rounded-lg" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice">
  <rect width="400" height="160" fill="#a53f22"/>
  <circle cx="120" cy="48" r="46" fill="var(--color-mustard)"/>
  <circle cx="300" cy="96" r="38" fill="var(--color-blue)"/>
  <circle cx="220" cy="128" r="30" fill="var(--color-green)"/>
</svg>`;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
