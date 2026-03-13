"use server";

import { setLojaConfig } from "@/lib/loja-config";
import type { LojaConfigMap } from "@/types/loja-config";

export async function saveAparenciaAction(
  chave: keyof LojaConfigMap,
  valor: LojaConfigMap[typeof chave]
): Promise<{ ok: boolean; error?: string }> {
  return setLojaConfig(chave, valor);
}
