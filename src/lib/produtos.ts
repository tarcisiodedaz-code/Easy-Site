import { supabase } from "./supabase";
import type { ProdutoLoja } from "./supabase";

export async function getProdutosLoja(): Promise<ProdutoLoja[]> {
  const { data, error } = await supabase
    .from("produtos_loja")
    .select("*")
    .is("deletado_em", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar produtos:", error);
    return [];
  }
  return (data ?? []) as ProdutoLoja[];
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getProdutoPorId(id: string): Promise<ProdutoLoja | null> {
  const byUuid = UUID_REGEX.test(id);
  const { data, error } = await supabase
    .from("produtos_loja")
    .select("*")
    .eq(byUuid ? "id" : "id_externo", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar produto:", error);
    return null;
  }
  return data as ProdutoLoja | null;
}

export async function getProdutoPorSlug(slug: string): Promise<ProdutoLoja | null> {
  const { data, error } = await supabase
    .from("produtos_loja")
    .select("*")
    .eq("slug", slug)
    .is("deletado_em", null)
    .maybeSingle();
  if (error) {
    console.error("Erro ao buscar produto por slug:", error);
    return null;
  }
  return data as ProdutoLoja | null;
}
