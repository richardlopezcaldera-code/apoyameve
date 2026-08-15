// Landing de ejemplo armada con el sistema de `lib/ui/`.
//
// Sirve de plantilla: para una landing nueva se copia este archivo, se cambia
// el contenido de `CONTENT` y se reordenan o quitan bloques. No hace falta
// tocar CSS ni espaciados — eso vive en los tokens y en los bloques.

import { page } from "../lib/ui/layout";
import {
  topbar,
  header,
  hero,
  categories,
  products,
  benefits,
  promo,
  footer,
  type NavItem,
} from "../lib/ui/blocks";

const BRAND = { a: "Mobiliario", b: "Tech" };

const NAV: NavItem[] = [
  { label: "Categorías", href: "#categorias", icon: "grid" },
  { label: "Espacios", href: "#espacios", icon: "sofa" },
  { label: "Inspiración", href: "#inspiracion", icon: "home" },
  { label: "Ofertas", href: "#ofertas", icon: "tag" },
];

export function landingHTML(): string {
  const body = [
    topbar("Tienda: Lunes a Viernes 10:00–19:00 · Sábado 10:00–18:00 · Despacho a todo Chile"),
    header(BRAND, NAV),

    `<main id="main">`,

    hero({
      title: "Tu espacio, bien hecho",
      subtitle: "Muebles de oficina y hogar a precio mayorista, con despacho a todo Chile.",
      cta: { label: "Ver catálogo", href: "#ofertas" },
      tags: ["Oficina", "Hogar"],
    }),

    benefits([
      { icon: "truck", title: "Despacho a todo Chile", note: "Coordinamos por WhatsApp" },
      { icon: "tag", title: "Precio mayorista", note: "Sin intermediarios" },
      { icon: "shield", title: "Garantía real", note: "12 meses en estructura" },
      { icon: "sofa", title: "Armado incluido", note: "En región Metropolitana" },
    ]),

    categories(
      "categorias",
      {
        eyebrow: "Catálogo",
        title: "Buscá por categoría",
        lead: "Todo lo que necesitás para equipar una oficina o renovar la casa.",
      },
      [
        { name: "Escritorios", note: "Desde $79.990", swatch: "#b24a2c" },
        { name: "Sillas", note: "Ergonómicas", swatch: "#e4be5c" },
        { name: "Estanterías", note: "Modulares", swatch: "#7fa9ce" },
        { name: "Sillones", note: "Living y espera", swatch: "#5e8c4e" },
        { name: "Mesas", note: "Comedor y centro", swatch: "#d9c5aa" },
      ],
    ),

    products(
      "ofertas",
      { eyebrow: "Ofertas", title: "Lo más vendido", more: { label: "Ver todo", href: "#" } },
      [
        { name: "Escritorio Nórdico 120 cm", category: "Escritorios", price: "$89.990", was: "$119.990", badge: "-25%" },
        { name: "Silla Ergonómica Malla Pro", category: "Sillas", price: "$74.990", was: "$99.990", badge: "-25%" },
        { name: "Estantería Modular 5 Niveles", category: "Estanterías", price: "$54.990" },
        { name: "Sillón Recibidor Tela", category: "Sillones", price: "$149.990", was: "$189.990", badge: "Oferta" },
      ],
    ),

    promo({
      title: "¿Equipás una oficina completa?",
      text: "Cotizamos por volumen y coordinamos la entrega en una sola visita. Contanos qué necesitás y te armamos el presupuesto.",
      cta: { label: "Pedir cotización", href: "#" },
    }),

    `</main>`,

    footer(
      BRAND,
      [
        {
          title: "Tienda",
          links: [
            { label: "Escritorios", href: "#" },
            { label: "Sillas", href: "#" },
            { label: "Estanterías", href: "#" },
          ],
        },
        {
          title: "Ayuda",
          links: [
            { label: "Despachos", href: "#" },
            { label: "Garantía", href: "#" },
            { label: "Contacto", href: "#" },
          ],
        },
        {
          title: "Empresa",
          links: [
            { label: "Nosotros", href: "#" },
            { label: "Showroom", href: "#" },
          ],
        },
      ],
      {
        whatsapp: "+56 9 6154 4423",
        legal: "© MobiliarioTech · Todos los derechos reservados",
      },
    ),
  ].join("\n");

  return page({
    title: "MobiliarioTech — Muebles de oficina y hogar",
    description:
      "Muebles de oficina y hogar a precio mayorista en Santiago. Despacho a todo Chile.",
    body,
  });
}
