"use server";

import { validateAdminSession } from "@/lib/auth-admin";
import { createAdminClient } from "@/lib/supabase-admin";
import { uploadImagemProduto } from "@/lib/storage";
import { slugify } from "@/lib/produtos-completo";
import { ensureSlugUnicoProduto } from "@/lib/slug-unico";

export async function cadastrarProduto(formData: FormData) {
  if (!(await validateAdminSession())) {
    return { ok: false, erro: "Não autorizado." };
  }

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { ok: false, erro: "Nome do produto é obrigatório." };

  const slugRaw = (formData.get("slug") as string)?.trim() || slugify(nome);
  const supabase = createAdminClient();
  const slug = await ensureSlugUnicoProduto(supabase, slugRaw);
  const idExterno = slug || `prod-${Date.now()}`;

  let imagemUrl: string | null = (formData.get("imagem_url") as string)?.trim() || null;
  const file = formData.get("imagem_file") as File | null;
  if (file?.size && file.size > 0) {
    const up = await uploadImagemProduto(file);
    if ("erro" in up) return { ok: false, erro: up.erro };
    imagemUrl = up.url;
  }

  const precoVenda = Number((formData.get("preco") as string)?.replace(",", ".")) || 0;
  const precoOriginal = Number((formData.get("preco_original") as string)?.replace(",", ".")) ?? precoVenda;
  const usarPromoPorConsole = formData.get("usar_preco_promocional_por_console") === "true";
  const precoCustoRaw = formData.get("preco_custo") ? Number((formData.get("preco_custo") as string).replace(",", ".")) : null;
  const precoCustoPs4 = formData.get("preco_custo_ps4") ? Number((formData.get("preco_custo_ps4") as string).replace(",", ".")) : null;
  const precoCustoPs5 = formData.get("preco_custo_ps5") ? Number((formData.get("preco_custo_ps5") as string).replace(",", ".")) : null;
  const precoCusto = usarPromoPorConsole
    ? (precoCustoPs4 != null && precoCustoPs5 != null ? Math.min(precoCustoPs4, precoCustoPs5) : precoCustoPs4 ?? precoCustoPs5 ?? precoCustoRaw)
    : precoCustoRaw;
  const precoCustoAnteriorRaw = (formData.get("preco_custo_anterior") as string)?.trim();
  const preco_custo_anterior = precoCustoAnteriorRaw ? Number(precoCustoAnteriorRaw.replace(",", ".")) : null;
  const precoPromocional = formData.get("preco_promocional") ? Number((formData.get("preco_promocional") as string).replace(",", ".")) : null;
  const precoPromocionalPs4 = formData.get("preco_promocional_ps4") ? Number((formData.get("preco_promocional_ps4") as string).replace(",", ".")) : null;
  const precoPromocionalPs5 = formData.get("preco_promocional_ps5") ? Number((formData.get("preco_promocional_ps5") as string).replace(",", ".")) : null;
  const quantidadeEstoque = Number(formData.get("quantidade_estoque") || 0);
  const quantidadeEstoquePs4 = formData.get("quantidade_estoque_ps4") ? Number(formData.get("quantidade_estoque_ps4")) : null;
  const quantidadeEstoquePs5 = formData.get("quantidade_estoque_ps5") ? Number(formData.get("quantidade_estoque_ps5")) : null;

  const categoriaIds = (formData.getAll("categoria_ids") as string[]).filter(Boolean);

  const { data: novo, error } = await supabase
    .from("produtos_loja")
    .insert({
      nome,
      descricao: (formData.get("descricao") as string) || null,
      ativo: formData.get("ativo") === "true",
      visivel_site: formData.get("visivel_site") === "true",
      em_destaque: formData.get("em_destaque") === "true",
      preco_custo: precoCusto,
      preco_custo_ps4: usarPromoPorConsole ? precoCustoPs4 : null,
      preco_custo_ps5: usarPromoPorConsole ? precoCustoPs5 : null,
      preco_custo_anterior: preco_custo_anterior ?? precoCusto,
      preco: precoVenda,
      preco_promocional: !usarPromoPorConsole ? precoPromocional : null,
      preco_promocional_ps4: usarPromoPorConsole ? precoPromocionalPs4 : null,
      preco_promocional_ps5: usarPromoPorConsole ? precoPromocionalPs5 : null,
      usar_preco_promocional_por_console: usarPromoPorConsole,
      preco_original: precoOriginal,
      gerenciar_estoque: formData.get("gerenciar_estoque") === "true",
      quantidade_estoque: quantidadeEstoque,
      quantidade_estoque_ps4: quantidadeEstoquePs4,
      quantidade_estoque_ps5: quantidadeEstoquePs5,
      imagem_url: imagemUrl,
      link_video: (formData.get("link_video") as string)?.trim() || null,
      slug: slug || null,
      categoria_id: null,
      subcategoria_id: null,
      id_externo: idExterno,
      url_origem: null,
      disponivel_ps4: formData.get("disponivel_ps4") !== "false",
      disponivel_ps5: formData.get("disponivel_ps5") !== "false",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { ok: false, erro: "Slug ou id_externo já existe. Altere a URL do produto." };
    console.error("Erro ao cadastrar produto:", error);
    return { ok: false, erro: error.message };
  }

  if (novo?.id && categoriaIds.length > 0) {
    const rows = categoriaIds.map((categoria_id) => ({ produto_id: novo.id, categoria_id }));
    const { error: errPc } = await supabase.from("produto_categorias").insert(rows);
    if (errPc) {
      console.error("Erro ao salvar categorias do produto:", errPc);
      return { ok: false, erro: errPc.message };
    }
  }
  return { ok: true };
}
