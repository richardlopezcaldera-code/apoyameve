// Compila el CSS del sitio a partir de los tokens.
//
//   lib/ui/tokens.ts  ──themeCSS()──>  lib/ui/theme.generated.css
//   lib/ui/theme.src.css  ──tailwind──>  lib/ui/styles.generated.ts
//
// El resultado se emite como módulo TS (no como .css) porque el Worker no
// tiene filesystem en runtime: la hoja viaja embebida en el bundle y se
// inyecta inline en el <head>, sin request extra.
//
// Uso: npm run build:css

import { writeFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const uiDir = join(root, "lib", "ui");

const { themeCSS } = await import(join(uiDir, "tokens.ts"));

// 1. Tokens -> bloque @theme
const generatedPath = join(uiDir, "theme.generated.css");
await mkdir(uiDir, { recursive: true });
await writeFile(
  generatedPath,
  `/* Generado por scripts/build-css.mjs desde lib/ui/tokens.ts. No editar. */\n\n${themeCSS()}\n`,
  "utf-8",
);
console.log("→ lib/ui/theme.generated.css");

// 2. Tailwind -> CSS compilado
const cssPath = join(uiDir, "styles.generated.css");
await execFileAsync(
  "npx",
  [
    "@tailwindcss/cli",
    "--input", join(uiDir, "theme.src.css"),
    "--output", cssPath,
    "--minify",
  ],
  { cwd: root },
);

// 3. CSS -> módulo TS
const { readFile } = await import("node:fs/promises");
const css = await readFile(cssPath, "utf-8");
const escaped = css.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

await writeFile(
  join(uiDir, "styles.generated.ts"),
  `// Generado por scripts/build-css.mjs. No editar.\n` +
    `// Para regenerar: npm run build:css\n\n` +
    `export const STYLES = \`${escaped}\`;\n`,
  "utf-8",
);

console.log(`→ lib/ui/styles.generated.ts (${(css.length / 1024).toFixed(1)} kB)`);
