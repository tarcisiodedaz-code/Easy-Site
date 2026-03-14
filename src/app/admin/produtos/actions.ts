"use server";

import { validateAdminSession } from "@/lib/auth-admin";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import type { ProdutoLoja } from "@/lib/supabase";
import { slugify } from "@/lib/produtos-completo";
import { ensureSlugUnicoProduto } from "@/lib/slug-unico";
import { descricaoPlayStationParaHtml } from "@/lib/scraper-playstation";

export type ProdutoEdicao = {
  nome: string;
  imagem_url: string | null;
  preco_original: number;
  preco: number;
  preco_custo?: number | null;
  preco_promocional?: number | null;
  descricao?: string | null;
  ativo?: boolean;
  em_destaque?: boolean;
  gerenciar_estoque?: boolean;
  quantidade_estoque?: number;
  slug?: string | null;
  /** Múltiplas categorias/subcategorias (tabela produto_categorias). Quando "Ofertas" está entre elas, é priorizada na listagem. */
  categoria_ids?: string[];
  oferta_inicio?: string | null;
  oferta_fim?: string | null;
  disponivel_ps4?: boolean;
  disponivel_ps5?: boolean;
};

export type ProdutoAdminRow = ProdutoLoja & {
  deletado_em?: string | null;
  ativo?: boolean;
  em_destaque?: boolean;
  preco_custo?: number | null;
  preco_promocional?: number | null;
  gerenciar_estoque?: boolean;
  quantidade_estoque?: number;
  slug?: string | null;
  categoria_id?: string | null;
  subcategoria_id?: string | null;
  /** Label de categorias para listagem (Ofertas priorizada quando selecionada) */
  categoria_nome?: string | null;
  subcategoria_nome?: string | null;
  pendente_info?: boolean;
  is_lancamento?: boolean;
  is_mais_vendido?: boolean;
};

const NOME_OFERTAS = "Ofertas";

/**
 * Monta o texto de categorias para a listagem:
 * - Mostra apenas categorias pai (subcategorias viram o nome do pai).
 * - Se "Ofertas" estiver entre as selecionadas, exibe só "Ofertas".
 */
function labelCategoriasParaListagem(
  catIds: string[],
  catMap: Record<string, { nome: string; parent_id: string | null }>,
  parentMap: Record<string, string>
): string | null {
  const nomesPai = new Set<string>();
  for (const id of catIds) {
    const cat = catMap[id];
    if (!cat) continue;
    const nomeExibir = cat.parent_id ? (parentMap[cat.parent_id] ?? cat.nome) : cat.nome;
    if (nomeExibir) nomesPai.add(nomeExibir);
  }
  if (nomesPai.size === 0) return null;
  const temOfertas = [...nomesPai].some((n) => n.trim().toLowerCase() === NOME_OFERTAS.toLowerCase());
  if (temOfertas) return NOME_OFERTAS;
  return [...nomesPai].sort().join(", ");
}

export async function getCategoriaIdsDoProduto(produtoId: string): Promise<string[]> {
  const ok = await validateAdminSession();
  if (!ok) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("produto_categorias")
    .select("categoria_id")
    .eq("produto_id", produtoId);
  if (!error && data?.length) {
    return (data as { categoria_id: string }[]).map((r) => r.categoria_id);
  }
  const { data: prod } = await supabase.from("produtos_loja").select("categoria_id, subcategoria_id").eq("id", produtoId).maybeSingle();
  if (!prod) return [];
  return [prod.categoria_id, prod.subcategoria_id].filter(Boolean) as string[];
}

export async function getProdutosParaAdmin(): Promise<ProdutoAdminRow[]> {
  if (!(await validateAdminSession())) return [];
  const supabase = createAdminClient();
  const { data: produtos, error } = await supabase
    .from("produtos_loja")
    .select("*")
    .is("deletado_em", null)
    .order("created_at", { ascending: false });
  if (error || !produtos?.length) return (produtos ?? []) as ProdutoAdminRow[];

  const produtoIds = (produtos as { id: string }[]).map((p) => p.id);
  const { data: pcData } = await supabase
    .from("produto_categorias")
    .select("produto_id, categoria_id")
    .in("produto_id", produtoIds);

  const catIdsByProduto = new Map<string, string[]>();
  if (pcData?.length) {
    for (const row of pcData as { produto_id: string; categoria_id: string }[]) {
      const list = catIdsByProduto.get(row.produto_id) ?? [];
      list.push(row.categoria_id);
      catIdsByProduto.set(row.produto_id, list);
    }
  }

  const allCatIds = new Set<string>();
  (produtos as { id: string; categoria_id?: string; subcategoria_id?: string }[]).forEach((p) => {
    const ids = (catIdsByProduto.get(p.id) ?? [p.categoria_id, p.subcategoria_id]).filter((id): id is string => Boolean(id));
    ids.forEach((id) => allCatIds.add(id));
  });
  const ids = Array.from(allCatIds);
  let catMap: Record<string, { nome: string; parent_id: string | null }> = {};
  let parentMap: Record<string, string> = {};
  if (ids.length > 0) {
    const { data: cats } = await supabase.from("categorias_produto").select("id, nome, parent_id").in("id", ids);
    const catList = (cats ?? []) as { id: string; nome: string; parent_id: string | null }[];
    catMap = Object.fromEntries(catList.map((c) => [c.id, { nome: c.nome, parent_id: c.parent_id }]));
    const parentIds = [...new Set(catList.map((c) => c.parent_id).filter(Boolean))] as string[];
    if (parentIds.length > 0) {
      const { data: parents } = await supabase.from("categorias_produto").select("id, nome").in("id", parentIds);
      parentMap = Object.fromEntries(((parents ?? []) as { id: string; nome: string }[]).map((c) => [c.id, c.nome]));
    }
  }

  const rows = (produtos as (ProdutoAdminRow & { pendente_info?: boolean })[]).map((p) => {
    const catIds = catIdsByProduto.get(p.id!) ?? [p.categoria_id, p.subcategoria_id].filter(Boolean) as string[];
    const categoria_nome = labelCategoriasParaListagem(catIds, catMap, parentMap);
    return {
      ...p,
      categoria_nome,
      subcategoria_nome: null,
      pendente_info: p.pendente_info === true,
    };
  });
  rows.sort((a, b) => (b.pendente_info ? 1 : 0) - (a.pendente_info ? 1 : 0));
  return rows;
}

export async function getProdutosLixeira(): Promise<ProdutoAdminRow[]> {
  if (!(await validateAdminSession())) return [];
  const supabase = createAdminClient();
  const { data: produtos, error } = await supabase
    .from("produtos_loja")
    .select("*")
    .not("deletado_em", "is", null)
    .order("deletado_em", { ascending: false });
  if (error || !produtos?.length) return (produtos ?? []) as ProdutoAdminRow[];
  const produtoIds = (produtos as { id: string }[]).map((p) => p.id);
  const { data: pcData } = await supabase
    .from("produto_categorias")
    .select("produto_id, categoria_id")
    .in("produto_id", produtoIds);
  const catIdsByProduto = new Map<string, string[]>();
  if (pcData?.length) {
    for (const row of pcData as { produto_id: string; categoria_id: string }[]) {
      const list = catIdsByProduto.get(row.produto_id) ?? [];
      list.push(row.categoria_id);
      catIdsByProduto.set(row.produto_id, list);
    }
  }
  const allCatIds = new Set<string>();
  (produtos as { id: string; categoria_id?: string; subcategoria_id?: string }[]).forEach((p) => {
    const ids = (catIdsByProduto.get(p.id) ?? [p.categoria_id, p.subcategoria_id]).filter((id): id is string => Boolean(id));
    ids.forEach((id) => allCatIds.add(id));
  });
  const ids = Array.from(allCatIds);
  let catMap: Record<string, { nome: string; parent_id: string | null }> = {};
  let parentMap: Record<string, string> = {};
  if (ids.length > 0) {
    const { data: cats } = await supabase.from("categorias_produto").select("id, nome, parent_id").in("id", ids);
    const catList = (cats ?? []) as { id: string; nome: string; parent_id: string | null }[];
    catMap = Object.fromEntries(catList.map((c) => [c.id, { nome: c.nome, parent_id: c.parent_id }]));
    const parentIds = [...new Set(catList.map((c) => c.parent_id).filter(Boolean))] as string[];
    if (parentIds.length > 0) {
      const { data: parents } = await supabase.from("categorias_produto").select("id, nome").in("id", parentIds);
      parentMap = Object.fromEntries(((parents ?? []) as { id: string; nome: string }[]).map((c) => [c.id, c.nome]));
    }
  }
  return (produtos as ProdutoAdminRow[]).map((p) => {
    const catIds = catIdsByProduto.get(p.id!) ?? [p.categoria_id, p.subcategoria_id].filter(Boolean) as string[];
    const categoria_nome = labelCategoriasParaListagem(catIds, catMap, parentMap);
    return { ...p, categoria_nome, subcategoria_nome: null };
  });
}

async function obterCategoriaOfertasId(
  supabase: ReturnType<typeof createAdminClient>
): Promise<string | null> {
  const { data, error } = await supabase
    .from("categorias_produto")
    .select("id, nome")
    .eq("nome", NOME_OFERTAS)
    .maybeSingle();
  if (error || !data?.id) return null;
  return data.id as string;
}

export async function atualizarProduto(
  id: string,
  dados: ProdutoEdicao
): Promise<{ ok: boolean; erro?: string }> {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  const supabase = createAdminClient();
  const update: Record<string, unknown> = {
    nome: dados.nome,
    imagem_url: dados.imagem_url ?? null,
    preco_original: dados.preco_original,
    preco: dados.preco,
  };
  if (dados.preco_custo !== undefined) update.preco_custo = dados.preco_custo;
  if (dados.preco_promocional !== undefined) update.preco_promocional = dados.preco_promocional;
  if (dados.descricao !== undefined) {
    const raw = typeof dados.descricao === "string" ? dados.descricao.trim() : "";
    update.descricao = raw ? descricaoPlayStationParaHtml(raw) : null;
  }
  if (dados.ativo !== undefined) update.ativo = dados.ativo;
  if (dados.em_destaque !== undefined) update.em_destaque = dados.em_destaque;
  if (dados.gerenciar_estoque !== undefined) update.gerenciar_estoque = dados.gerenciar_estoque;
  if (dados.quantidade_estoque !== undefined) update.quantidade_estoque = dados.quantidade_estoque;
  if (dados.slug !== undefined) {
    const slugRaw = dados.slug?.trim() || slugify(dados.nome);
    update.slug = slugRaw ? await ensureSlugUnicoProduto(supabase, slugRaw, id) : null;
  }
  if (dados.oferta_inicio !== undefined) update.oferta_inicio = dados.oferta_inicio || null;
  if (dados.oferta_fim !== undefined) update.oferta_fim = dados.oferta_fim || null;
  if (dados.disponivel_ps4 !== undefined) update.disponivel_ps4 = dados.disponivel_ps4;
  if (dados.disponivel_ps5 !== undefined) update.disponivel_ps5 = dados.disponivel_ps5;
  update.pendente_info = false;
  const { error } = await supabase.from("produtos_loja").update(update).eq("id", id);
  if (error) {
    console.error("Erro ao atualizar produto:", error);
    return { ok: false, erro: error.message };
  }
  if (dados.categoria_ids !== undefined) {
    await supabase.from("produto_categorias").delete().eq("produto_id", id);
    if (dados.categoria_ids.length > 0) {
      const rows = dados.categoria_ids.map((categoria_id) => ({ produto_id: id, categoria_id }));
      const { error: errPc } = await supabase.from("produto_categorias").insert(rows);
      if (errPc) {
        console.error("Erro ao salvar categorias do produto:", errPc);
        return { ok: false, erro: errPc.message };
      }
    }
  }
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/produtos/lixeira");
  return { ok: true };
}

/** Mover para lixeira (soft delete) */
export async function moverParaLixeira(id: string): Promise<{ ok: boolean; erro?: string }> {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("produtos_loja")
    .update({ deletado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("Erro ao mover para lixeira:", error);
    return { ok: false, erro: error.message };
  }
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/produtos/lixeira");
  return { ok: true };
}

/** Restaurar da lixeira */
export async function restaurarProduto(id: string): Promise<{ ok: boolean; erro?: string }> {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("produtos_loja")
    .update({ deletado_em: null })
    .eq("id", id);
  if (error) {
    console.error("Erro ao restaurar:", error);
    return { ok: false, erro: error.message };
  }
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/produtos/lixeira");
  return { ok: true };
}

/** Excluir permanentemente do banco */
export async function excluirPermanentemente(id: string): Promise<{ ok: boolean; erro?: string }> {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  const supabase = createAdminClient();
  const { error } = await supabase.from("produtos_loja").delete().eq("id", id);
  if (error) {
    console.error("Erro ao excluir:", error);
    return { ok: false, erro: error.message };
  }
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/produtos/lixeira");
  return { ok: true };
}

/** Encerrar promoções: define preco_promocional e período como null nos IDs selecionados */
export async function encerrarPromocoesSelecionadas(
  ids: string[]
): Promise<{ ok: boolean; erro?: string; count?: number }> {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  if (ids.length === 0) return { ok: true, count: 0 };
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("produtos_loja")
    .update({ preco_promocional: null, oferta_inicio: null, oferta_fim: null })
    .in("id", ids);
  if (error) {
    console.error("Erro ao encerrar promoções:", error);
    return { ok: false, erro: error.message };
  }
  // Remove categoria "Ofertas" dos produtos selecionados
  const catId = await obterCategoriaOfertasId(supabase);
  if (catId) {
    await supabase
      .from("produto_categorias")
      .delete()
      .eq("categoria_id", catId)
      .in("produto_id", ids);
  }
  revalidatePath("/admin/produtos");
  return { ok: true, count: ids.length };
}

/** Alternar is_lancamento de um produto (vitrine Lançamentos). is_mais_vendido não é usado se a coluna não existir no banco. */
export async function toggleVitrineProduto(
  id: string,
  campo: "is_lancamento" | "is_mais_vendido",
  valor: boolean
): Promise<{ ok: boolean; erro?: string }> {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  if (campo === "is_mais_vendido") return { ok: true };
  const supabase = createAdminClient();
  const { error } = await supabase.from("produtos_loja").update({ [campo]: valor }).eq("id", id);
  if (error) {
    console.error("Erro ao atualizar vitrine:", error);
    return { ok: false, erro: error.message };
  }
  revalidatePath("/admin/produtos");
  revalidatePath("/");
  return { ok: true };
}

/** Alternar em_destaque (Destaques por Categoria na vitrine). */
export async function toggleDestaqueProduto(id: string, valor: boolean): Promise<{ ok: boolean; erro?: string }> {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  const supabase = createAdminClient();
  const { error } = await supabase.from("produtos_loja").update({ em_destaque: valor }).eq("id", id);
  if (error) {
    console.error("Erro ao atualizar destaque:", error);
    return { ok: false, erro: error.message };
  }
  revalidatePath("/admin/produtos");
  revalidatePath("/");
  return { ok: true };
}

/** Limpar todas as ofertas da loja (preco_promocional e período = null em todos) */
export async function limparTodasOfertas(): Promise<{ ok: boolean; erro?: string; count?: number }> {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  const supabase = createAdminClient();
  const { data: list } = await supabase
    .from("produtos_loja")
    .select("id")
    .is("deletado_em", null);
  const ids = (list ?? []).map((r: { id: string }) => r.id);
  if (ids.length === 0) return { ok: true, count: 0 };
  const { error } = await supabase
    .from("produtos_loja")
    .update({ preco_promocional: null, oferta_inicio: null, oferta_fim: null })
    .is("deletado_em", null);
  if (error) {
    console.error("Erro ao limpar ofertas:", error);
    return { ok: false, erro: error.message };
  }
  // Remove categoria "Ofertas" de todos os produtos
  const catId = await obterCategoriaOfertasId(supabase);
  if (catId) {
    await supabase.from("produto_categorias").delete().eq("categoria_id", catId);
  }
  revalidatePath("/admin/produtos");
  return { ok: true, count: ids.length };
}
