import { supabase } from "./supabase";

export type CategoriaProduto = {
  id: string;
  nome: string;
  parent_id: string | null;
  slug?: string | null;
  icon_url?: string | null;
};

export type ProdutoCompleto = {
  nome: string;
  descricao: string | null;
  ativo: boolean;
  visivel_site: boolean;
  em_destaque: boolean;
  preco_custo: number | null;
  preco: number;
  preco_promocional: number | null;
  preco_original: number;
  gerenciar_estoque: boolean;
  quantidade_estoque: number;
  imagem_url: string | null;
  link_video: string | null;
  slug: string | null;
  categoria_id: string | null;
  subcategoria_id: string | null;
  id_externo: string;
  url_origem: string | null;
};

export async function getCategoriasProduto(): Promise<CategoriaProduto[]> {
  const { data, error } = await supabase
    .from("categorias_produto")
    .select("id, nome, parent_id, icon_url")
    .order("nome");
  if (error) {
    console.error("Erro ao buscar categorias produto:", error);
    return [];
  }
  const rows = (data ?? []) as { id: string; nome: string; parent_id: string | null; icon_url?: string | null }[];
  return rows.map((r) => ({ ...r, slug: null }));
}

/** Categorias em árvore para o menu (pais com filhos), com href = /categorias/slug ou /categorias/paiSlug/filhoSlug */
export type CategoriaMenu = {
  id: string;
  nome: string;
  slug: string | null;
  href: string;
  icon_url?: string | null;
  filhos: { id: string; nome: string; slug: string | null; href: string; icon_url?: string | null }[];
};

export async function getCategoriasProdutoParaMenu(): Promise<CategoriaMenu[]> {
  const categorias = await getCategoriasProduto();
  const pais = categorias.filter((c) => !c.parent_id);
  const filhos = categorias.filter((c) => c.parent_id);
  const slug = (c: CategoriaProduto) => (c.slug && c.slug.trim() ? c.slug.trim() : slugify(c.nome));
  return pais.map((p) => {
      const ps = slug(p);
      const filhosPai = filhos.filter((f) => f.parent_id === p.id);
      return {
        id: p.id,
        nome: p.nome,
        slug: ps,
        href: `/categorias/${ps}`,
        icon_url: p.icon_url ?? null,
        filhos: filhosPai.map((f) => {
          const fs = slug(f);
          return { id: f.id, nome: f.nome, slug: fs, href: `/categorias/${ps}/${fs}`, icon_url: f.icon_url ?? null };
        }),
      };
    });
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Resolve slug(s) para o id da categoria. Um slug = pai ou filho; dois = pai/filho (retorna o filho). */
export async function getCategoriaIdPorSlugs(slugs: string[]): Promise<string | null> {
  if (slugs.length === 0) return null;
  const categorias = await getCategoriasProduto();
  const norm = (s: string) => s.trim().toLowerCase();
  const catSlug = (c: CategoriaProduto) => norm(c.slug && c.slug.trim() ? c.slug : slugify(c.nome));
  const bySlug = (s: string) => (c: CategoriaProduto) => catSlug(c) === norm(s);
  if (slugs.length === 1) {
    const cat = categorias.find(bySlug(slugs[0]));
    return cat?.id ?? null;
  }
  const pai = categorias.find((c) => !c.parent_id && bySlug(slugs[0])(c));
  if (!pai) return null;
  const filho = categorias.find((c) => c.parent_id === pai.id && bySlug(slugs[1])(c));
  return filho?.id ?? pai.id;
}

/** Produtos que pertencem à categoria (produto_categorias). */
export async function getProdutosPorCategoriaId(categoriaId: string): Promise<import("./supabase").ProdutoLoja[]> {
  const { data: pc } = await supabase
    .from("produto_categorias")
    .select("produto_id")
    .eq("categoria_id", categoriaId);
  const produtoIds = [...new Set((pc ?? []).map((r: { produto_id: string }) => r.produto_id))];
  if (produtoIds.length === 0) return [];
  const { data, error } = await supabase
    .from("produtos_loja")
    .select("*")
    .in("id", produtoIds)
    .is("deletado_em", null)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Erro ao buscar produtos por categoria:", error);
    return [];
  }
  return (data ?? []) as import("./supabase").ProdutoLoja[];
}

/** IDs das categorias de um produto (para uso público, ex.: relacionados). */
export async function getCategoriaIdsDoProduto(produtoId: string): Promise<string[]> {
  const { data } = await supabase
    .from("produto_categorias")
    .select("categoria_id")
    .eq("produto_id", produtoId);
  return (data ?? []).map((r: { categoria_id: string }) => r.categoria_id);
}

/** Mapa produto_id -> categoria_ids para vários produtos (filtro por gênero/subcategoria). */
export async function getCategoriaIdsPorProdutos(produtoIds: string[]): Promise<Map<string, string[]>> {
  if (produtoIds.length === 0) return new Map();
  const { data } = await supabase
    .from("produto_categorias")
    .select("produto_id, categoria_id")
    .in("produto_id", produtoIds);
  const map = new Map<string, string[]>();
  for (const row of data ?? []) {
    const r = row as { produto_id: string; categoria_id: string };
    const arr = map.get(r.produto_id) ?? [];
    if (!arr.includes(r.categoria_id)) arr.push(r.categoria_id);
    map.set(r.produto_id, arr);
  }
  return map;
}

/** Quem viu este também gostou: até `limit` produtos da mesma categoria, excluindo o atual. */
export async function getProdutosRelacionados(
  produtoId: string,
  categoriaIds: string[],
  limit: number
): Promise<import("./supabase").ProdutoLoja[]> {
  if (categoriaIds.length === 0) return [];
  const { data: pc } = await supabase
    .from("produto_categorias")
    .select("produto_id")
    .in("categoria_id", categoriaIds)
    .neq("produto_id", produtoId);
  const produtoIds = [...new Set((pc ?? []).map((r: { produto_id: string }) => r.produto_id))];
  const shuffled = produtoIds.sort(() => Math.random() - 0.5).slice(0, limit);
  if (shuffled.length === 0) return [];
  const { data, error } = await supabase
    .from("produtos_loja")
    .select("*")
    .in("id", shuffled)
    .is("deletado_em", null);
  if (error || !data?.length) return [];
  return data as import("./supabase").ProdutoLoja[];
}
