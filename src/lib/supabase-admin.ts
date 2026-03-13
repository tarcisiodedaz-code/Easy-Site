import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Cliente Supabase com Service Role. Usar apenas no servidor (Server Actions, API routes)
 * e somente após validar sessão admin (validateAdminSession).
 */
export function createAdminClient() {
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY (e NEXT_PUBLIC_SUPABASE_URL) são necessários para operações admin.");
  }
  return createClient(url, serviceRoleKey);
}
