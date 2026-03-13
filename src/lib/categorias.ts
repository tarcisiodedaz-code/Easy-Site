import { supabase } from "./supabase";

export type Categoria = {
  id: string;
  nome: string;
  href: string | null;
  icon: string | null;
  icon_url: string | null;
  ordem: number;
  created_at?: string;
};

export type CategoriaItem = {
  id: string;
  categoria_id: string;
  label: string;
  href: string;
  ordem: number;
  created_at?: string;
};

export type CategoriaComItens = Categoria & { itens: CategoriaItem[] };

export async function getCategorias(): Promise<CategoriaComItens[]> {
  const { data: cats, error: errCat } = await supabase
    .from("categorias")
    .select("*")
    .order("ordem", { ascending: true });

  if (errCat) {
    console.error("Erro ao buscar categorias:", errCat);
    return [];
  }
  if (!cats?.length) return [];

  const { data: itens, error: errItens } = await supabase
    .from("categoria_itens")
    .select("*")
    .order("ordem", { ascending: true });

  if (errItens) {
    console.error("Erro ao buscar itens de categorias:", errItens);
    return (cats as Categoria[]).map((c) => ({ ...c, itens: [] }));
  }

  const itensByCat = (itens as CategoriaItem[]).reduce<Record<string, CategoriaItem[]>>(
    (acc, i) => {
      if (!acc[i.categoria_id]) acc[i.categoria_id] = [];
      acc[i.categoria_id].push(i);
      return acc;
    },
    {}
  );

  return (cats as Categoria[]).map((c) => ({
    ...c,
    itens: itensByCat[c.id] ?? [],
  }));
}

export async function getCategoriaPorId(id: string): Promise<CategoriaComItens | null> {
  const { data: cat, error: errCat } = await supabase
    .from("categorias")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (errCat || !cat) return null;

  const { data: itens } = await supabase
    .from("categoria_itens")
    .select("*")
    .eq("categoria_id", id)
    .order("ordem", { ascending: true });

  return {
    ...(cat as Categoria),
    itens: (itens as CategoriaItem[]) ?? [],
  };
}

export async function criarCategoria(dados: {
  nome: string;
  href?: string | null;
  icon?: string | null;
  icon_url?: string | null;
  ordem?: number;
}): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("categorias")
    .insert({
      nome: dados.nome,
      href: dados.href ?? null,
      icon: dados.icon ?? null,
      icon_url: dados.icon_url ?? null,
      ordem: dados.ordem ?? 0,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Erro ao criar categoria:", error);
    return null;
  }
  return { id: data.id };
}

export async function atualizarCategoria(
  id: string,
  dados: { nome: string; href?: string | null; icon?: string | null; icon_url?: string | null; ordem?: number }
) {
  const { error } = await supabase
    .from("categorias")
    .update({
      nome: dados.nome,
      href: dados.href ?? null,
      icon: dados.icon ?? null,
      ...(dados.icon_url !== undefined && { icon_url: dados.icon_url }),
      ...(dados.ordem !== undefined && { ordem: dados.ordem }),
    })
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar categoria:", error);
    return false;
  }
  return true;
}

export async function excluirCategoria(id: string) {
  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) {
    console.error("Erro ao excluir categoria:", error);
    return false;
  }
  return true;
}

export async function salvarItensCategoria(
  categoriaId: string,
  itens: { label: string; href: string; ordem?: number }[]
) {
  await supabase.from("categoria_itens").delete().eq("categoria_id", categoriaId);

  if (itens.length === 0) return true;

  const rows = itens.map((item, i) => ({
    categoria_id: categoriaId,
    label: item.label,
    href: item.href,
    ordem: item.ordem ?? i,
  }));

  const { error } = await supabase.from("categoria_itens").insert(rows);
  if (error) {
    console.error("Erro ao salvar itens da categoria:", error);
    return false;
  }
  return true;
}

export const ICONES_DISPONIVEIS = [
  { value: "pages", label: "Páginas (lista)" },
  { value: "clock", label: "Relógio" },
  { value: "ps4", label: "PlayStation" },
  { value: "ps5", label: "PlayStation 5" },
  { value: "gift", label: "Gift card" },
  { value: "tag", label: "Etiqueta/Ofertas" },
] as const;
