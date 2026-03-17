import { supabase } from "./supabase";
import { createAdminClient } from "./supabase-admin";
import { validateAdminSession } from "@/lib/auth-admin";
import { DEFAULTS, type LojaConfigMap } from "@/types/loja-config";

export async function getLojaConfig<K extends keyof LojaConfigMap>(
  chave: K
): Promise<LojaConfigMap[K]> {
  const { data, error } = await supabase
    .from("loja_config")
    .select("valor")
    .eq("chave", chave)
    .maybeSingle();
  if (error || !data?.valor) return DEFAULTS[chave];
  return data.valor as LojaConfigMap[K];
}

export async function getAllLojaConfig(): Promise<Partial<LojaConfigMap>> {
  const { data, error } = await supabase.from("loja_config").select("chave, valor");
  if (error || !data?.length) return {};
  const result = data.reduce<Record<string, unknown>>((acc, row) => {
    const chave = row.chave as keyof LojaConfigMap;
    if (chave in DEFAULTS) acc[chave] = row.valor ?? undefined;
    return acc;
  }, {});
  return result as Partial<LojaConfigMap>;
}

/** Salva uma chave da config. Apenas admin (chamada após validateAdminSession). */
export async function setLojaConfig<K extends keyof LojaConfigMap>(
  chave: K,
  valor: LojaConfigMap[K]
): Promise<{ ok: boolean; error?: string }> {
  const ok = await validateAdminSession();
  if (!ok) return { ok: false, error: "Não autorizado" };
  try {
    const admin = createAdminClient();
    // A coluna valor é NOT NULL; usar {} quando for null/undefined (ex.: logo/favicon removidos)
    const valorDb = valor ?? {};
    const { error } = await admin
      .from("loja_config")
      .upsert({ chave, valor: valorDb, updated_at: new Date().toISOString() }, { onConflict: "chave" });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar" };
  }
}
