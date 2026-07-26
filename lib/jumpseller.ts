// Cliente mínimo de la API de Jumpseller (server-side, corre en el Worker).
// Las credenciales llegan por el binding `env` del Worker, nunca al cliente.

const API = "https://api.jumpseller.com/v1";

export type Credentials = { login: string; authtoken: string };

export type Product = {
  id: number;
  name: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  imageUrl: string | null;
  category: string | null;
  inStock: boolean;
  quotable: boolean;
  permalink: string;
};

type RawImage = { url: string; position: number };
type RawCategory = { id: number; name: string };
type RawProduct = {
  id: number;
  name: string;
  price: number;
  compare_at_price: number | null;
  currency: string;
  status: string;
  stock: number | null;
  stock_unlimited: boolean;
  quotable: boolean;
  permalink: string;
  images: RawImage[];
  categories: RawCategory[];
};

function auth(creds: Credentials, params: Record<string, string> = {}): string {
  return new URLSearchParams({ ...creds, ...params }).toString();
}

function normalize(raw: RawProduct): Product {
  const primary =
    [...(raw.images ?? [])].sort((a, b) => a.position - b.position)[0]?.url ?? null;
  const inStock = raw.stock_unlimited || (raw.stock ?? 0) > 0;
  return {
    id: raw.id,
    name: raw.name,
    price: raw.price,
    compareAtPrice: raw.compare_at_price ?? null,
    currency: raw.currency ?? "CLP",
    imageUrl: primary,
    category: raw.categories?.[0]?.name ?? null,
    inStock: raw.status === "available" && inStock,
    quotable: Boolean(raw.quotable),
    permalink: raw.permalink,
  };
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cf: { cacheTtl: 300 } } as RequestInit);
  if (!res.ok) {
    throw new Error(`Jumpseller respondió ${res.status} en ${url.split("?")[0]}`);
  }
  return (await res.json()) as T;
}

export async function listProducts(creds: Credentials, limit = 50): Promise<Product[]> {
  const data = await getJSON<{ product: RawProduct }[]>(
    `${API}/products.json?${auth(creds, { limit: String(limit) })}`,
  );
  return data.map((d) => normalize(d.product));
}

export async function getProduct(creds: Credentials, id: number): Promise<Product> {
  const data = await getJSON<{ product: RawProduct }>(
    `${API}/products/${id}.json?${auth(creds)}`,
  );
  return normalize(data.product);
}
