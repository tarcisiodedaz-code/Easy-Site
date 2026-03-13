import { supabase } from "./supabase";

export type SecaoVitrine = "lancamentos" | "mais_vendidos" | "destaques";

export type ConfigHome = {
  /** Ordem das seções na Home (ex.: Lançamentos primeiro, depois Mais Vendidos, Destaques). */
  ordem_secoes: SecaoVitrine[];
};

const ORDEM_PADRAO: SecaoVitrine[] = ["lancamentos", "mais_vendidos", "destaques"];

/** Configuração da vitrine da home (leitura pública). */
export async function getConfigHome(): Promise<ConfigHome> {
  const { data, error } = await supabase
    .from("config_home")
    .select("ordem_secoes")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data?.ordem_secoes || !Array.isArray(data.ordem_secoes)) {
    return { ordem_secoes: ORDEM_PADRAO };
  }
  const ordem = data.ordem_secoes as string[];
  const validos: SecaoVitrine[] = ordem.filter((k): k is SecaoVitrine =>
    ["lancamentos", "mais_vendidos", "destaques"].includes(k)
  );
  return { ordem_secoes: validos.length ? validos : ORDEM_PADRAO };
}
