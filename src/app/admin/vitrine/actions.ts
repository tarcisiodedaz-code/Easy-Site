"use server";

import { validateAdminSession } from "@/lib/auth-admin";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import type { ConfigHome } from "@/lib/config-home";

export async function getConfigHomeAdmin(): Promise<ConfigHome | null> {
  if (!(await validateAdminSession())) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("config_home")
    .select("ordem_secoes")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return null;
  const ordem = data.ordem_secoes;
  if (!ordem || !Array.isArray(ordem)) {
    return { ordem_secoes: ["lancamentos", "mais_vendidos", "destaques"] };
  }
  const validos = ordem.filter((k: string) =>
    ["lancamentos", "mais_vendidos", "destaques"].includes(k)
  ) as ConfigHome["ordem_secoes"];
  return { ordem_secoes: validos.length ? validos : ["lancamentos", "mais_vendidos", "destaques"] };
}

export async function salvarConfigHome(config: ConfigHome): Promise<{ ok: boolean; erro?: string }> {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("config_home")
    .upsert(
      {
        id: 1,
        ordem_secoes: config.ordem_secoes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  if (error) {
    console.error("Erro ao salvar config_home:", error);
    return { ok: false, erro: error.message };
  }
  revalidatePath("/");
  revalidatePath("/admin/vitrine");
  return { ok: true };
}
