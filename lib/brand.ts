// Identidad de marca de MobiliarioTech. Los valores vienen de la tienda
// Jumpseller; los colores son un punto de partida y se ajustan luego.
export const BRAND = {
  name: "MobiliarioTech",
  logoUrl:
    "https://images.jumpseller.com/store/mobiliariotech/store/logo/Logo_Landing_Mobiliaria_TechChile.png",
  whatsapp: "+56 9 6154 4423",
  // Paleta cálida de la tienda (coherente con la home aprobada).
  // primary = acento terracota, dark = texto tinta, light = crema (fondo/sobre acento).
  colors: {
    primary: "#b24a2c", // rust / terracota — acentos, chips, barra CTA
    dark: "#1c1815", // ink — texto
    light: "#fbf7f0", // crema — fondo de las piezas y texto sobre el acento
    muted: "#8a7c6a", // texto suave / precio tachado
    sale: "#1c1815", // sello OFERTA en tinta oscura (premium, alto contraste)
  },
  cta: "Despacho a todo Chile · ¡Consulta ya!",
} as const;
