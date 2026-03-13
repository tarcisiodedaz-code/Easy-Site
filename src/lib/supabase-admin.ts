import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

/**
 * Cliente Supabase com Service Role. Usar apenas no servidor (Server Actions, API routes)
 * e somente após validar sessão admin (validateAdminSession).
 */
export function createAdminClient() {
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não está configurada.");
  }
  // Usa service_role se disponível, senão usa anon key como fallback
  const key = serviceRoleKey || anonKey;
  if (!key) {
    throw new Error("Nenhuma chave do Supabase configurada (SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY).");
  }
  return createClient(url, key);
}

/** Verifica se está usando a service role key (permissão total) */
export function hasServiceRoleKey(): boolean {
  return !!serviceRoleKey;
}
