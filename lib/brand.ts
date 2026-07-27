// Identidad de marca de MobiliarioTech. Los valores vienen de la tienda
// Jumpseller; los colores son un punto de partida y se ajustan luego.
export const BRAND = {
  name: "MobiliarioTech",
  logoUrl:
    "https://images.jumpseller.com/store/mobiliariotech/store/logo/Logo_Landing_Mobiliaria_TechChile.png",
  whatsapp: "+56 9 6154 4423",
  // Paleta inicial (ajustable). primary = acento, dark = texto, light = fondo.
  colors: {
    primary: "#1f6feb",
    dark: "#0f172a",
    light: "#ffffff",
    muted: "#64748b",
    sale: "#e11d48",
  },
  cta: "Despacho a todo Chile · ¡Consulta ya!",
} as const;
