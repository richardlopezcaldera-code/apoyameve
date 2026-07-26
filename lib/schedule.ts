import { suggested, type Product } from "./jumpseller";

// Elige el producto para un índice de rotación dado, entre los elegibles.
// Prioriza sugeridos (ofertas/destacados); si no hay, usa todos los con stock.
export function pickForIndex(products: Product[], index: number): Product | null {
  const sug = suggested(products);
  const pool = (sug.length ? sug : products).filter((p) => p.inStock || p.quotable);
  if (!pool.length) return null;
  return pool[((index % pool.length) + pool.length) % pool.length];
}
