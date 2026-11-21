import { Hono } from "hono";

export type Bindings = {
  // Variables públicas (wrangler.toml → [vars]).
  APP_NAME: string;
  ENVIRONMENT: string;
  // Secrets (wrangler secret put / .dev.vars). Opcionales.
  API_TOKEN?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Página de inicio: sirve para confirmar de un vistazo que el Worker está vivo.
app.get("/", (c) => {
  const { APP_NAME, ENVIRONMENT } = c.env;
  return c.html(
    `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${APP_NAME}</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    font: 16px/1.5 system-ui, sans-serif;
  }
  main { text-align: center; padding: 2rem; }
  h1 { margin: 0 0 .25rem; font-size: 1.5rem; }
  p { margin: 0; opacity: .7; }
  code { font-family: ui-monospace, monospace; }
</style>
</head>
<body>
  <main>
    <h1>${APP_NAME}</h1>
    <p>Worker activo — entorno <code>${ENVIRONMENT}</code></p>
  </main>
</body>
</html>`,
  );
});

// Healthcheck: lo que consultan los monitores externos.
app.get("/api/health", (c) =>
  c.json({
    ok: true,
    app: c.env.APP_NAME,
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  }),
);

// Ruta de ejemplo protegida por token. Si API_TOKEN no está configurado,
// queda cerrada en vez de abierta.
app.post("/api/echo", async (c) => {
  const expected = c.env.API_TOKEN;
  if (!expected) {
    return c.json({ error: "API_TOKEN no está configurado en este Worker." }, 503);
  }
  if (c.req.header("authorization") !== `Bearer ${expected}`) {
    return c.json({ error: "No autorizado." }, 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "El cuerpo debe ser JSON válido." }, 400);
  }

  return c.json({ received: body });
});

app.notFound((c) => c.json({ error: "Ruta no encontrada." }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Error interno." }, 500);
});

export default app;
