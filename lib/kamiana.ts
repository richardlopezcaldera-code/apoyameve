// Modelos y accesos a la base compartida (Supabase, tablas `kam_*`).
//
// Es la MISMA base que usa el Cotizador (crm-multiempresa). Acá se declaran los
// modelos de todas las tablas y los accesos de lectura que necesita apoyameve
// (sobre todo el catálogo de productos), más un mapeo a la `Product` que usan
// las plantillas de avisos.
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase, type SupabaseEnv } from "./supabase";
import type { Product } from "./jumpseller";

// ─── Modelos (reflejan Supabase_esquema_kamiana.sql) ─────────────────
export type KamUsuario = {
  usuario: string;
  pass?: string;
  role: string;
  name: string;
  updated_at?: string;
};

export type KamCliente = {
  id: string;
  nombre: string;
  rut: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  giro: string | null;
  updated_at?: string;
};

export type KamProducto = {
  id: string;
  nombre: string;
  sku: string | null;
  categoria: string | null;
  costo: number | null;
  precio: number | null;
  proveedor: string | null;
  imagen: string | null;
  deleted: boolean;
  updated_at?: string;
};

export type KamProveedor = {
  id: string;
  nombre: string;
  rut: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
};

export type KamCotizacion = {
  id: string;
  numero: string | null;
  fecha: string | null;
  cliente_id: string | null;
  vendedor: string | null;
  vendedor_name: string | null;
  items: unknown;
  despacho: number | null;
  pct: number | null;
  obs: string | null;
  estado: string | null;
  oc_numero: string | null;
  aprobada_fecha: string | null;
  data: unknown;
  updated_at?: string;
};

export type KamConfig = { key: string; value: unknown };

// ─── Accesos de lectura ──────────────────────────────────────────────
export async function listProductos(
  env: SupabaseEnv,
  limit = 100,
): Promise<KamProducto[]> {
  const db: SupabaseClient = getSupabase(env);
  const { data, error } = await db
    .from("kam_productos")
    .select("*")
    .eq("deleted", false)
    .order("nombre", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`Supabase kam_productos: ${error.message}`);
  return (data ?? []) as KamProducto[];
}

export async function getProducto(
  env: SupabaseEnv,
  id: string,
): Promise<KamProducto | null> {
  const db: SupabaseClient = getSupabase(env);
  const { data, error } = await db
    .from("kam_productos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Supabase kam_productos/${id}: ${error.message}`);
  return (data as KamProducto | null) ?? null;
}

export async function listClientes(
  env: SupabaseEnv,
  limit = 100,
): Promise<KamCliente[]> {
  const db: SupabaseClient = getSupabase(env);
  const { data, error } = await db
    .from("kam_clientes")
    .select("*")
    .order("nombre", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`Supabase kam_clientes: ${error.message}`);
  return (data ?? []) as KamCliente[];
}

// ─── Mapeo al modelo de avisos ───────────────────────────────────────
// Las plantillas usan nombre, precio e imagen; `id` no se dibuja, así que un
// producto del catálogo compartido se puede renderizar directamente.
export function toProduct(k: KamProducto): Product {
  const price = k.precio ?? 0;
  return {
    id: 0,
    name: k.nombre,
    price,
    compareAtPrice: null,
    currency: "CLP",
    imageUrl: k.imagen,
    category: k.categoria,
    inStock: !k.deleted,
    quotable: price <= 0,
    featured: false,
    permalink: k.sku || k.id,
  };
}
