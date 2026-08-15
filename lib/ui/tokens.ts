// ── Fuente única de verdad del diseño ──────────────────────────────────────
//
// Editá SOLO este archivo para cambiar la identidad visual de todas las
// páginas. Cada token de acá sale por dos caminos:
//
//   1. `themeCSS()` genera el bloque `@theme` de Tailwind v4, del que Tailwind
//      deriva las utilidades (`bg-rust`, `font-display`, `ease-out-soft`...).
//   2. Los objetos exportados los consume el código TS que renderiza en el
//      servidor (Satori para las piezas 1080×1080, que no entiende CSS).
//
// Así no hay dos paletas que se puedan desincronizar.
//
// Después de tocar este archivo: `npm run build:css`.

/** Paleta. Valores tomados de la home aprobada (`src/home.ts`). */
export const color = {
  // Fondos cálidos, del más claro al más saturado.
  cream: "#f3ece1",
  cream2: "#efe5d6",
  card: "#fbf7f0",
  beige: "#d9c5aa",

  // Tinta y grises cálidos.
  ink: "#1c1815",
  inkSoft: "#4a4038",
  muted: "#8a7c6a",
  line: "#e2d6c3",

  // Acentos.
  rust: "#b24a2c",
  rustInk: "#8f3a20",
  mustard: "#e4be5c",
  blue: "#7fa9ce",
  green: "#5e8c4e",

  // Texto sobre superficies oscuras o de acento.
  onInk: "#f4ece0",
  onRust: "#fdf1e7",
} as const;

/**
 * Tipografía. La display es la manuscrita del hero; la sans lleva todo el resto.
 * Se cargan como variables CSS para poder cambiarlas sin tocar el markup.
 */
export const font = {
  sans: '"Poppins", "Quicksand", ui-rounded, "Segoe UI", system-ui, sans-serif',
  display: '"Caveat", "Segoe Script", "Bradley Hand", cursive',
} as const;

/**
 * Escala de espaciado por sección. Marketing quiere aire: los saltos son
 * grandes y fluidos (`clamp`) para no necesitar un breakpoint por tamaño.
 */
export const space = {
  sectionY: "clamp(44px, 6vw, 80px)",
  gutter: "clamp(16px, 4vw, 40px)",
  wrap: "1240px",
} as const;

/** Radios. Un solo valor base evita el "cada card con su redondeo". */
export const radius = {
  sm: "6px",
  md: "14px",
  lg: "20px",
  pill: "999px",
} as const;

/**
 * Movimiento. Duraciones cortas para feedback directo (hover, press) y algo
 * más largas para entradas. `stagger` lo consume el reveal al hacer scroll.
 *
 * Alineado con la guía del skill UI/UX Pro Max: entrada 300-450ms, la salida
 * más rápida que la entrada, y todo detrás de `prefers-reduced-motion`.
 */
export const motion = {
  fast: "120ms",
  base: "220ms",
  enter: "400ms",
  exit: "260ms",
  easeOutSoft: "cubic-bezier(.22,.61,.36,1)",
  easeBack: "cubic-bezier(.34,1.36,.64,1)",
  stagger: 60, // ms entre items de una grilla
} as const;

/**
 * Breakpoints, como umbrales `min-width`.
 *
 * Ojo con la distinción: los tamaños de prueba son 375 / 768 / 1024 / 1440,
 * pero un breakpoint EN 375 haría que el móvil chico ya entre en `sm:` y se
 * quede sin su layout base. Cada umbral arranca por encima de su tamaño de
 * prueba, así 375px sólo recibe las utilidades sin prefijo.
 */
export const screens = {
  sm: "480px",
  md: "768px",
  lg: "1024px",
  xl: "1440px",
} as const;

/**
 * Emite el bloque `@theme` que consume Tailwind v4.
 *
 * Los nombres siguen la convención de namespaces de Tailwind (`--color-*`,
 * `--font-*`, `--radius-*`, `--ease-*`), que es lo que hace que genere
 * `bg-rust`, `rounded-md`, `ease-out-soft` y compañía automáticamente.
 */
export function themeCSS(): string {
  const lines: string[] = ["@theme {"];

  // Descarta la paleta y las familias por defecto de Tailwind. Este es un
  // sitio de marca cerrada: dejar los ~250 colores de fábrica sólo infla el
  // CSS y habilita `bg-blue-500` en un diseño donde no existe el azul de
  // Tailwind. `transparent`, `current` e `inherit` sobreviven: son especiales.
  lines.push("  --color-*: initial;");
  lines.push("  --font-*: initial;");
  lines.push("  --white: #ffffff;");
  lines.push("  --black: #000000;");
  lines.push("");

  lines.push("  /* Colores */");
  for (const [name, value] of Object.entries(color)) {
    lines.push(`  --color-${kebab(name)}: ${value};`);
  }

  lines.push("", "  /* Tipografía */");
  lines.push(`  --font-sans: ${font.sans};`);
  lines.push(`  --font-display: ${font.display};`);

  lines.push("", "  /* Radios */");
  for (const [name, value] of Object.entries(radius)) {
    lines.push(`  --radius-${kebab(name)}: ${value};`);
  }

  lines.push("", "  /* Movimiento */");
  lines.push(`  --ease-out-soft: ${motion.easeOutSoft};`);
  lines.push(`  --ease-back: ${motion.easeBack};`);

  lines.push("", "  /* Breakpoints */");
  for (const [name, value] of Object.entries(screens)) {
    lines.push(`  --breakpoint-${name}: ${value};`);
  }

  lines.push("}");

  // Variables sueltas: no son utilidades de Tailwind, pero las usan las
  // utilidades propias de `theme.src.css` y algún estilo inline.
  lines.push(
    "",
    ":root {",
    `  --section-y: ${space.sectionY};`,
    `  --gutter: ${space.gutter};`,
    `  --wrap: ${space.wrap};`,
    `  --dur-fast: ${motion.fast};`,
    `  --dur-base: ${motion.base};`,
    `  --dur-enter: ${motion.enter};`,
    `  --dur-exit: ${motion.exit};`,
    "}",
  );

  return lines.join("\n");
}

function kebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
