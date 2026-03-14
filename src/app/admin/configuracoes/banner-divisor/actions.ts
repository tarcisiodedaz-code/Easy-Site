"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import type { BannerDivisorItem } from "@/types/loja-config";

type BannerDivisorConfigInput = {
  ativo: boolean;
  titulo_principal: string;
  imagem_fundo_url?: string | null;
  itens: BannerDivisorItem[];
};

export async function salvarBannerDivisor(config: BannerDivisorConfigInput) {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("loja_config")
      .upsert(
        {
          chave: "banner_divisor",
          valor: config,
        },
        { onConflict: "chave" }
      );

    if (error) {
      console.error("Erro ao salvar banner_divisor:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/admin/configuracoes/banner-divisor");

    return { success: true };
  } catch (err) {
    console.error("Erro ao salvar banner_divisor:", err);
    return { success: false, error: "Erro interno ao salvar configuração." };
  }
}
