"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { calcularPrecoPromocionalAPartirDoCusto } from "@/lib/preco-revenda";
import { revalidatePath } from "next/cache";

type ImportarEstoqueInput = {
  jogo_id: string;
  game_name: string;
  custo_medio: number;
  custo_medio_ps4?: number;
  custo_medio_ps5?: number;
  qtd_ps4: number;
  qtd_ps5: number;
  qtd_total: number;
  preco_venda_editado?: number;
};

async function obterCategoriaOfertasId(
  supabase: ReturnType<typeof createAdminClient>
): Promise<string | null> {
  const { data, error } = await supabase
    .from("categorias_produto")
    .select("id, nome")
    .or("nome.ilike.%ofertas%,nome.ilike.%oferta%")
    .limit(1)
    .maybeSingle();
  if (error || !data?.id) return null;
  return data.id as string;
}

function normalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function calcularSimilaridade(nome1: string, nome2: string): number {
  const palavras1 = normalizarNome(nome1).split(" ").filter((w) => w.length > 2);
  const palavras2 = normalizarNome(nome2).split(" ").filter((w) => w.length > 2);
  
  if (palavras1.length === 0 || palavras2.length === 0) return 0;
  
  let matches = 0;
  for (const palavra of palavras1) {
    if (palavras2.some((pw) => pw === palavra || pw.includes(palavra) || palavra.includes(pw))) {
      matches++;
    }
  }
  
  return matches / Math.max(palavras1.length, palavras2.length);
}

export async function buscarProdutoExistentePorNome(
  supabase: ReturnType<typeof createAdminClient>,
  nome: string
): Promise<{ id: string; nome: string; preco: number; gerenciar_estoque: boolean; quantidade_estoque: number } | null> {
  const { data: exato } = await supabase
    .from("produtos_loja")
    .select("id, nome, preco, gerenciar_estoque, quantidade_estoque")
    .eq("nome", nome)
    .is("deletado_em", null)
    .maybeSingle();
  
  if (exato) {
    return exato as { id: string; nome: string; preco: number; gerenciar_estoque: boolean; quantidade_estoque: number };
  }
  
  const { data: todos } = await supabase
    .from("produtos_loja")
    .select("id, nome, preco, gerenciar_estoque, quantidade_estoque")
    .is("deletado_em", null);
  
  if (!todos || todos.length === 0) return null;
  
  const nomeNormalizado = normalizarNome(nome);
  
  for (const p of todos) {
    if (normalizarNome(p.nome) === nomeNormalizado) {
      return p as { id: string; nome: string; preco: number; gerenciar_estoque: boolean; quantidade_estoque: number };
    }
  }
  
  let melhorMatch: typeof todos[0] | null = null;
  let melhorScore = 0;
  
  for (const p of todos) {
    const score = calcularSimilaridade(nome, p.nome);
    if (score > 0.7 && score > melhorScore) {
      melhorScore = score;
      melhorMatch = p;
    }
  }
  
  return melhorMatch as { id: string; nome: string; preco: number; gerenciar_estoque: boolean; quantidade_estoque: number } | null;
}

function buildPromocionalFromEstoque(input: ImportarEstoqueInput): {
  preco_custo: number;
  preco_custo_ps4: number | null;
  preco_custo_ps5: number | null;
  preco_promocional: number | null;
  preco_promocional_ps4: number | null;
  preco_promocional_ps5: number | null;
  usar_preco_promocional_por_console: boolean;
} {
  const custoPs4 = input.custo_medio_ps4 ?? input.custo_medio;
  const custoPs5 = input.custo_medio_ps5 ?? input.custo_medio;
  const temPs4 = input.qtd_ps4 > 0;
  const temPs5 = input.qtd_ps5 > 0;

  const preco_custo_ps4 = temPs4 ? custoPs4 : null;
  const preco_custo_ps5 = temPs5 ? custoPs5 : null;
  const preco_custo = temPs4 && temPs5 ? Math.min(custoPs4, custoPs5) : (temPs4 ? custoPs4 : custoPs5);

  const custoUnico = Math.abs(custoPs4 - custoPs5) < 0.02 || (!temPs4 || !temPs5);

  if (custoUnico) {
    const custoUnicoValor = temPs4 && temPs5 ? Math.min(custoPs4, custoPs5) : (temPs4 ? custoPs4 : custoPs5);
    const promo = calcularPrecoPromocionalAPartirDoCusto(custoUnicoValor);
    return {
      preco_custo,
      preco_custo_ps4,
      preco_custo_ps5,
      preco_promocional: promo,
      preco_promocional_ps4: null,
      preco_promocional_ps5: null,
      usar_preco_promocional_por_console: false,
    };
  }

  const promoPs4 = temPs4 ? calcularPrecoPromocionalAPartirDoCusto(custoPs4) : 0;
  const promoPs5 = temPs5 ? calcularPrecoPromocionalAPartirDoCusto(custoPs5) : 0;
  return {
    preco_custo,
    preco_custo_ps4,
    preco_custo_ps5,
    preco_promocional: null,
    preco_promocional_ps4: temPs4 ? promoPs4 : null,
    preco_promocional_ps5: temPs5 ? promoPs5 : null,
    usar_preco_promocional_por_console: true,
  };
}

export async function importarDoEstoque(input: ImportarEstoqueInput): Promise<{
  sucesso: boolean;
  mensagem: string;
  tipo: "criado" | "atualizado" | "erro";
}> {
  try {
    const supabase = createAdminClient();

    const disponivelPs4 = input.qtd_ps4 > 0;
    const disponivelPs5 = input.qtd_ps5 > 0;
    const promoFields = buildPromocionalFromEstoque(input);

    const categoriaOfertasId = await obterCategoriaOfertasId(supabase);
    const existente = await buscarProdutoExistentePorNome(supabase, input.game_name);

    if (existente) {
      const update: Record<string, unknown> = {
        preco_custo: promoFields.preco_custo,
        preco_custo_ps4: promoFields.preco_custo_ps4,
        preco_custo_ps5: promoFields.preco_custo_ps5,
        preco_promocional: promoFields.preco_promocional,
        preco_promocional_ps4: promoFields.preco_promocional_ps4,
        preco_promocional_ps5: promoFields.preco_promocional_ps5,
        usar_preco_promocional_por_console: promoFields.usar_preco_promocional_por_console,
        gerenciar_estoque: true,
        quantidade_estoque: input.qtd_total,
        quantidade_estoque_ps4: input.qtd_ps4,
        quantidade_estoque_ps5: input.qtd_ps5,
        disponivel_ps4: disponivelPs4,
        disponivel_ps5: disponivelPs5,
        ativo: true,
        id_externo: `estoque-${input.jogo_id}`,
        url_origem: null,
      };

      const { error } = await supabase
        .from("produtos_loja")
        .update(update)
        .eq("id", existente.id);

      if (error) {
        console.error("Erro ao atualizar produto:", error);
        return { sucesso: false, mensagem: error.message, tipo: "erro" };
      }

      if (categoriaOfertasId) {
        const { data: catExiste } = await supabase
          .from("produto_categorias")
          .select("id")
          .eq("produto_id", existente.id)
          .eq("categoria_id", categoriaOfertasId)
          .maybeSingle();

        if (!catExiste) {
          await supabase
            .from("produto_categorias")
            .insert({ produto_id: existente.id, categoria_id: categoriaOfertasId });
        }
      }

      revalidatePath("/admin/produtos");
      revalidatePath("/");

      const nomesDiferentes = existente.nome !== input.game_name;
      return {
        sucesso: true,
        mensagem: nomesDiferentes
          ? `Atualizado "${existente.nome}": custo e promo aplicados, estoque: ${input.qtd_total}`
          : `"${input.game_name}" atualizado: custo e promo aplicados, estoque: ${input.qtd_total}`,
        tipo: "atualizado",
      };
    }

    const precoBase = promoFields.preco_custo * 2;
    const slug = input.game_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data: novoProduto, error } = await supabase
      .from("produtos_loja")
      .insert({
        nome: input.game_name,
        slug: slug + "-" + Date.now(),
        preco: precoBase,
        preco_original: precoBase,
        preco_custo: promoFields.preco_custo,
        preco_custo_ps4: promoFields.preco_custo_ps4,
        preco_custo_ps5: promoFields.preco_custo_ps5,
        preco_custo_anterior: promoFields.preco_custo,
        preco_promocional: promoFields.preco_promocional,
        preco_promocional_ps4: promoFields.preco_promocional_ps4,
        preco_promocional_ps5: promoFields.preco_promocional_ps5,
        usar_preco_promocional_por_console: promoFields.usar_preco_promocional_por_console,
        gerenciar_estoque: true,
        quantidade_estoque: input.qtd_total,
        quantidade_estoque_ps4: input.qtd_ps4,
        quantidade_estoque_ps5: input.qtd_ps5,
        disponivel_ps4: disponivelPs4,
        disponivel_ps5: disponivelPs5,
        ativo: true,
        em_destaque: false,
        id_externo: `estoque-${input.jogo_id}`,
      })
      .select("id")
      .single();

    if (error || !novoProduto) {
      console.error("Erro ao criar produto:", error);
      return { sucesso: false, mensagem: error?.message ?? "Erro desconhecido", tipo: "erro" };
    }

    if (categoriaOfertasId) {
      await supabase
        .from("produto_categorias")
        .insert({ produto_id: novoProduto.id, categoria_id: categoriaOfertasId });
    }

    revalidatePath("/admin/produtos");
    revalidatePath("/");

    return {
      sucesso: true,
      mensagem: `"${input.game_name}" criado com promo, estoque: ${input.qtd_total}`,
      tipo: "criado",
    };
  } catch (e) {
    console.error("Erro ao importar do estoque:", e);
    return { sucesso: false, mensagem: String(e), tipo: "erro" };
  }
}

export async function buscarProdutosLoja(): Promise<
  { id: string; nome: string; preco: number; ativo: boolean; estoque: number | null }[]
> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("produtos_loja")
      .select("id, nome, preco, ativo, quantidade_estoque")
      .is("deletado_em", null)
      .order("nome");
    
    if (error) {
      console.error("Erro ao buscar produtos da loja:", error);
      return [];
    }
    
    const resultado = (data ?? []).map((p) => ({
      id: p.id,
      nome: p.nome,
      preco: p.preco,
      ativo: p.ativo,
      estoque: p.quantidade_estoque,
    }));
    
    return resultado;
  } catch (e) {
    console.error("Erro ao buscar produtos da loja:", e);
    return [];
  }
}
