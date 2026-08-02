// Cliente de Supabase (server-side, corre en el Worker).
//
// apoyameve comparte la MISMA base de datos que el Cotizador (crm-multiempresa):
// ambos proyectos apuntan al mismo proyecto de Supabase. Así apoyameve lee los
// mismos productos/clientes que el CRM ("la misma información").
//
// Las credenciales llegan por el binding `env` del Worker (secrets), nunca al
// cliente ni al repositorio. En el Cotizador estas mismas claves se llaman
// SUPA_URL / SUPA_KEY; acá usamos SUPABASE_URL / SUPABASE_KEY.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseEnv = {
  SUPABASE_URL?: string;
  SUPABASE_KEY?: string;
};

export function hasSupabase(env: SupabaseEnv): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_KEY);
}

export function getSupabase(env: SupabaseEnv): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
    throw new Error(
      "Faltan SUPABASE_URL / SUPABASE_KEY. Configuralos como secrets del Worker " +
        "(`wrangler secret put`) o en `.dev.vars` para desarrollo local.",
    );
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}
