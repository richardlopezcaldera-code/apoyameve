# Sistema de plantillas

Bloques reusables en Tailwind v4 para armar landings y páginas con la misma
identidad, sin duplicar markup ni reajustar espaciados a mano.

## Cómo está armado

```
lib/ui/
  tokens.ts       ← EL archivo que editás para reskinear (colores, fuentes, motion)
  theme.src.css   ← entrada de Tailwind: base, utilidades propias, reveal
  layout.ts       ← page(): <head>, fuentes, estilos, script de reveal
  blocks.ts       ← bloques: topbar, header, hero, categories, products…
  svg.ts          ← iconos y gráficos de relleno (todo vectorial, sin assets)

  theme.generated.css   ← generado, no editar
  styles.generated.ts   ← generado, no editar
```

El CSS se compila con Tailwind real (sin CDN) y viaja **embebido** en el
bundle del Worker, que no tiene filesystem en runtime. Por eso el resultado
sale como módulo TS y no como `.css`.

## Armar una landing nueva

Copiá `src/landing.ts`, cambiá el contenido y componé los bloques que quieras:

```ts
import { page } from "../lib/ui/layout";
import { header, hero, products, footer } from "../lib/ui/blocks";

export function miLandingHTML(): string {
  const body = [
    header(BRAND, NAV),
    `<main id="main">`,
    hero({
      title: "Tu titular",
      subtitle: "Tu bajada.",
      cta: { label: "Ver más", href: "#" },
    }),
    products("ofertas", { eyebrow: "Ofertas", title: "Destacados" }, ITEMS),
    `</main>`,
    footer(BRAND, COLUMNS, CONTACT),
  ].join("\n");

  return page({ title: "…", description: "…", body });
}
```

Registrala en `src/index.ts`:

```ts
app.get("/mi-landing", (c) => c.html(miLandingHTML()));
```

Los bloques son independientes: traen su propio contenedor (`wrap`) y su ritmo
vertical (`section-y`), así que se reordenan o se quitan sin tocar CSS.

## Cambiar la identidad visual

Editá **sólo** `tokens.ts` y corré `npm run build:css`. Cambiar `color.rust`
repinta acentos, hovers, badges y focus en todas las páginas a la vez.

`build:css` ya corre solo dentro de `npm run dev`, `build` y `deploy`, así que
no se puede desplegar con el CSS desactualizado.

## Reglas que conviene no romper

**Clases completas, nunca interpoladas.** Tailwind escanea el fuente como
texto plano: `bg-${color}` no aparece en el CSS final. Usá un mapa:

```ts
const BG = { rust: "bg-rust", blue: "bg-blue" } as const;  // ✅
`bg-${c}`                                                   // ❌ no se genera
```

**Los breakpoints arrancan por encima del tamaño de prueba.** `sm` es 480px,
no 375px. Si `sm` fuera 375, el móvil chico ya entraría en `sm:` y se quedaría
sin su layout base.

**El movimiento nunca puede esconder contenido.** El reveal por scroll aplica
`opacity: 0` sólo bajo `html.js`, tiene un barrido de respaldo por si el
IntersectionObserver no llega a disparar (scroll rápido, salto por ancla), y
se desactiva entero con `prefers-reduced-motion`. Sin JS todo se ve normal.

**Iconos vectoriales, no emojis.** Los emojis dependen de la fuente del
sistema, cambian de forma entre plataformas y no se pueden tematizar. Están en
`svg.ts`; los decorativos llevan `aria-hidden`, los que van solos llevan
nombre accesible.

## Verificación

Comprobado en Chromium a 375 / 768 / 1440: sin scroll horizontal, sin
elementos del reveal que queden invisibles, y sin errores de consola más allá
de la carga de Google Fonts.

## Pendiente

- Los gráficos son SVG de relleno. Al haber fotos reales, se reemplazan en
  `svg.ts` sin tocar los bloques.
- `src/home.ts` sigue con su CSS propio. Migrarla a estos bloques dejaría una
  sola fuente de estilos; hoy conviven.
