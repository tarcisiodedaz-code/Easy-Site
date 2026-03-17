import { supabase } from "./supabase";
import type { ProdutoLoja } from "./supabase";

/** Últimos produtos cadastrados (lançamentos automáticos por created_at). */
export async function getProdutosLancamentos(limit = 8): Promise<ProdutoLoja[]> {
  const { data, error } = await supabase
    .from("produtos_loja")
    .select("*")
    .is("deletado_em", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as ProdutoLoja[];
}

/**
 * Mais vendidos: produtos com maior quantidade vendida (pedidos pago/entregue).
 * Fallback: se não houver vendas, retorna os mais recentes (created_at).
 */
export async function getProdutosMaisVendidos(limit = 8): Promise<ProdutoLoja[]> {
  const { data: pedidosPagos } = await supabase
    .from("pedidos")
    .select("id")
    .in("situacao", ["pago", "entregue"]);

  const pedidoIds = (pedidosPagos ?? []).map((p: { id: string }) => p.id);
  if (pedidoIds.length === 0) {
    return getProdutosMaisVendidosFallback(limit);
  }

  const { data: itens } = await supabase
    .from("pedido_itens")
    .select("produto_id, quantidade")
    .in("pedido_id", pedidoIds);

  if (!itens?.length) return getProdutosMaisVendidosFallback(limit);

  const totalPorProduto = new Map<string, number>();
  for (const row of itens as { produto_id: string; quantidade: number }[]) {
    totalPorProduto.set(row.produto_id, (totalPorProduto.get(row.produto_id) ?? 0) + row.quantidade);
  }
  const idsOrdenados = [...totalPorProduto.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (idsOrdenados.length === 0) return getProdutosMaisVendidosFallback(limit);

  const { data: produtos, error } = await supabase
    .from("produtos_loja")
    .select("*")
    .in("id", idsOrdenados)
    .is("deletado_em", null);

  if (error || !produtos?.length) return getProdutosMaisVendidosFallback(limit);

  const porId = new Map((produtos as ProdutoLoja[]).map((p) => [p.id!, p]));
  return idsOrdenados.map((id) => porId.get(id)).filter(Boolean) as ProdutoLoja[];
}

async function getProdutosMaisVendidosFallback(limit: number): Promise<ProdutoLoja[]> {
  const { data, error } = await supabase
    .from("produtos_loja")
    .select("*")
    .is("deletado_em", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return error ? [] : (data ?? []) as ProdutoLoja[];
}

/** Produtos em destaque (em_destaque = true) para a seção "Destaques por Categoria". */
export async function getProdutosDestaques(limit = 8): Promise<ProdutoLoja[]> {
  const { data, error } = await supabase
    .from("produtos_loja")
    .select("*")
    .eq("em_destaque", true)
    .is("deletado_em", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as ProdutoLoja[];
}
