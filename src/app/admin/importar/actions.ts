"use server";

import { validateAdminSession } from "@/lib/auth-admin";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  buscarOfertasPlayStation,
  buscarJogoPlayStation,
  descricaoPlayStationParaHtml,
  type OfertaScraped,
} from "@/lib/scraper-playstation";
import { calcularPrecoCusto, calcularPrecoPromocionalAPartirDoCusto } from "@/lib/preco-revenda";
import { setLojaConfig, getLojaConfig } from "@/lib/loja-config";
import { buscarCapaAltaPorNome } from "@/lib/rawg-cover";
import type { OfertaImportada, JogoImportado } from "@/types/importar";

const URL_PLAYSTATION =
  "https://store.playstation.com/pt-br/category/3f772501-f6f8-49b7-abac-874a88ca4897/1";

const TERMOS_EXCLUSAO = [
  "pacote de expansão",
  "expansão",
  "nível",
  "level",
  "passe de temporada",
  "season pass",
];

function deveIgnorarPorFiltro(titulo: string): boolean {
  const t = titulo.toLowerCase().trim();
  return TERMOS_EXCLUSAO.some((termo) => t.includes(termo));
}

/**
 * Busca ofertas reais da PlayStation Store, aplica fórmula de revenda e arredondamento psicológico.
 * Remove itens que contêm termos de exclusão no título.
 */
export async function buscarOfertas(
  url: string,
  _margemPercentual: number,
  numPaginas: number = 1
): Promise<{
  ok: boolean;
  ofertas: OfertaImportada[];
  ignoradosPorFiltro: number;
  erro?: string;
}> {
  const urlBusca = url && url.trim() !== "" ? url.trim() : URL_PLAYSTATION;
  const res = await buscarOfertasPlayStation(urlBusca, numPaginas);
  if (!res.ok) {
    return { ok: false, ofertas: [], ignoradosPorFiltro: 0, erro: res.erro };
  }
  const todos: OfertaScraped[] = res.ofertas;
  const filtrados = todos.filter((o) => !deveIgnorarPorFiltro(o.nome));
  const ignoradosPorFiltro = todos.length - filtrados.length;
  const ofertas: OfertaImportada[] = filtrados.map((o) => {
    const precoSonyVerde = o.preco_sony_verde;
    const precoSonyVermelho = o.preco_sony_vermelho && o.preco_sony_vermelho > 0
      ? o.preco_sony_vermelho
      : o.preco_sony_verde;

    const precoCusto = calcularPrecoCusto(precoSonyVerde);
    const precoVenda = calcularPrecoCusto(precoSonyVermelho);
    const precoPromocional = calcularPrecoPromocionalAPartirDoCusto(precoCusto);
    return {
      id_externo: o.id_externo,
      nome: o.nome,
      imagem_url: o.imagem_url,
      preco_sony_verde: precoSonyVerde,
      preco_sony_vermelho: o.preco_sony_vermelho ?? null,
      preco_custo: precoCusto,
      preco_venda: precoVenda,
      preco_promocional: precoPromocional,
      url_origem: urlBusca,
    };
  });
  return { ok: true, ofertas, ignoradosPorFiltro };
}

// Sufixos que DEVEM atualizar o produto base (mesma edição)
const SUFIXOS_ATUALIZAR = [
  "deluxe",
  "deluxe edition",
  "standard",
  "standard edition",
];

// Sufixos que NÃO devem atualizar (criar como novo produto)
const SUFIXOS_CRIAR_NOVO = [
  "ultimate",
  "ultimate edition",
  "gold",
  "gold edition",
  "collector",
  "collector edition",
  "collector's edition",
  "goty",
  "game of the year",
  "game of the year edition",
  "complete",
  "complete edition",
  "definitive",
  "definitive edition",
  "premium",
  "premium edition",
  "legendary",
  "legendary edition",
  "special",
  "special edition",
  "limited",
  "limited edition",
  "enhanced",
  "enhanced edition",
  "remastered",
  "digital deluxe",
  "digital deluxe edition",
];

/**
 * Remove sufixos de edição do nome para obter o nome base do jogo.
 */
function obterNomeBase(nome: string): string {
  let nomeBase = nome.trim();
  const nomeLower = nomeBase.toLowerCase();
  
  // Remove sufixos conhecidos (do mais longo para o mais curto)
  const todosSufixos = [...SUFIXOS_ATUALIZAR, ...SUFIXOS_CRIAR_NOVO]
    .sort((a, b) => b.length - a.length);
  
  for (const sufixo of todosSufixos) {
    const regex = new RegExp(`\\s*[-–—:]?\\s*${sufixo}\\s*$`, "i");
    if (regex.test(nomeLower)) {
      nomeBase = nomeBase.replace(regex, "").trim();
      break;
    }
  }
  
  return nomeBase;
}

/**
 * Verifica se o nome contém um sufixo que deve CRIAR novo produto.
 */
function temSufixoCriarNovo(nome: string): boolean {
  const nomeLower = nome.toLowerCase();
  return SUFIXOS_CRIAR_NOVO.some((sufixo) => {
    const regex = new RegExp(`\\s*[-–—:]?\\s*${sufixo}\\s*$`, "i");
    return regex.test(nomeLower);
  });
}

/**
 * Verifica se o nome contém um sufixo que deve ATUALIZAR produto existente.
 */
function temSufixoAtualizar(nome: string): boolean {
  const nomeLower = nome.toLowerCase();
  return SUFIXOS_ATUALIZAR.some((sufixo) => {
    const regex = new RegExp(`\\s*[-–—:]?\\s*${sufixo}\\s*$`, "i");
    return regex.test(nomeLower);
  });
}

async function buscarProdutoExistente(
  supabase: ReturnType<typeof createAdminClient>,
  idExterno: string,
  nome: string
): Promise<{ id: string } | null> {
  // 1. Busca por ID externo (sempre tem prioridade)
  const { data: porId } = await supabase
    .from("produtos_loja")
    .select("id")
    .eq("id_externo", idExterno)
    .is("deletado_em", null)
    .maybeSingle();
  if (porId) return porId;
  
  // 2. Busca por nome EXATO
  const { data: porNomeExato } = await supabase
    .from("produtos_loja")
    .select("id")
    .eq("nome", nome)
    .is("deletado_em", null)
    .maybeSingle();
  if (porNomeExato) return porNomeExato;
  
  // 3. Se tem sufixo de CRIAR NOVO (Ultimate, Gold, etc.), não busca por nome base
  //    Deixa criar como produto novo
  if (temSufixoCriarNovo(nome)) {
    return null;
  }
  
  // 4. Se tem sufixo de ATUALIZAR (Deluxe, Standard), busca pelo nome base
  if (temSufixoAtualizar(nome)) {
    const nomeBase = obterNomeBase(nome);
    if (nomeBase !== nome) {
      const { data: porNomeBase } = await supabase
        .from("produtos_loja")
        .select("id")
        .eq("nome", nomeBase)
        .is("deletado_em", null)
        .maybeSingle();
      if (porNomeBase) return porNomeBase;
    }
  }
  
  return null;
}

async function obterMelhorImagem(nome: string, urlOferta: string | null): Promise<string | null> {
  const capaAlta = await buscarCapaAltaPorNome(nome);
  if (capaAlta) return capaAlta;
  return urlOferta || null;
}

async function obterCategoriaOfertasId(
  supabase: ReturnType<typeof createAdminClient>
): Promise<string | null> {
  const { data, error } = await supabase
    .from("categorias_produto")
    .select("id, nome")
    .eq("nome", "Ofertas")
    .maybeSingle();
  if (error || !data?.id) return null;
  return data.id as string;
}

async function garantirCategoriaOfertasParaProduto(
  supabase: ReturnType<typeof createAdminClient>,
  produtoId: string
): Promise<void> {
  const catId = await obterCategoriaOfertasId(supabase);
  if (!catId) return;
  const { data: existente } = await supabase
    .from("produto_categorias")
    .select("produto_id")
    .eq("produto_id", produtoId)
    .eq("categoria_id", catId)
    .maybeSingle();
  if (existente) return;
  await supabase.from("produto_categorias").insert({ produto_id: produtoId, categoria_id: catId });
}

export type ResultadoImportacao = {
  ok: boolean;
  atualizado?: boolean;
  novo?: boolean;
  erro?: string;
};

/**
 * Salva ou atualiza um produto.
 * Existente: move preco_custo → preco_custo_anterior; atualiza preco_custo (fornecedor) e preco_promocional (.99).
 * Preço de venda (preco) e preco_original NÃO são alterados na importação.
 * Novo: cria como Inativo, pendente_info = true, descrição vazia.
 */
export async function subirParaLoja(oferta: OfertaImportada): Promise<ResultadoImportacao> {
  if (!(await validateAdminSession())) {
    return { ok: false, erro: "Não autorizado." };
  }
  const supabase = createAdminClient();
  const existente = await buscarProdutoExistente(supabase, oferta.id_externo, oferta.nome);
  const imagemUrl = await obterMelhorImagem(oferta.nome, oferta.imagem_url || null);

  if (existente) {
    const { data: atual } = await supabase
      .from("produtos_loja")
      .select("preco_custo")
      .eq("id", existente.id)
      .single();
    const custoAnterior = atual?.preco_custo ?? null;
    const custoRegistrado = oferta.preco_custo;
    const { error } = await supabase
      .from("produtos_loja")
      .update({
        preco_custo_anterior: custoAnterior,
        // Atualiza custo e mantém a mesma regra de preço promocional (custo + faixa),
        // sem alterar o preço de venda (preco).
        preco_custo: custoRegistrado,
        preco_promocional: oferta.preco_promocional,
      })
      .eq("id", existente.id);
    if (error) {
      console.error("Erro ao atualizar produto:", error);
      return { ok: false, erro: error.message };
    }
    await garantirCategoriaOfertasParaProduto(supabase, existente.id);
    return { ok: true, atualizado: true };
  }

  const slug = oferta.nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const idExterno = oferta.id_externo || `imp-${Date.now()}-${slug.slice(0, 20)}`;

  const custoRegistrado = oferta.preco_custo;
  const { data: novo, error } = await supabase
    .from("produtos_loja")
    .insert({
      nome: oferta.nome,
      imagem_url: imagemUrl,
      preco_original: 0,
      preco: 0,
      id_externo: idExterno,
      url_origem: oferta.url_origem || null,
      ativo: false,
      pendente_info: true,
      descricao: null,
      preco_custo: custoRegistrado,
      // Mantém a mesma regra de preço promocional (custo + faixa) para novos produtos.
      preco_promocional: oferta.preco_promocional,
      gerenciar_estoque: false,
      quantidade_estoque: 0,
      slug: slug || null,
      categoria_id: null,
      subcategoria_id: null,
    })
    .select("id")
    .single();

  if (error || !novo?.id) {
    console.error("Erro ao salvar produto:", error);
    return { ok: false, erro: error?.message ?? "Erro ao salvar produto." };
  }
  await garantirCategoriaOfertasParaProduto(supabase, novo.id as string);
  return { ok: true, novo: true };
}

export type ResumoImportacao = {
  ok: boolean;
  atualizados: number;
  novos: number;
  ignorados: number;
  erros: string[];
};

/**
 * Importa em lote todas as ofertas exibidas (já filtradas) e retorna o resumo.
 */
export async function importarTodos(
  ofertas: OfertaImportada[],
  totalIgnoradosPorFiltro: number
): Promise<ResumoImportacao> {
  if (!(await validateAdminSession())) {
    return { ok: false, atualizados: 0, novos: 0, ignorados: totalIgnoradosPorFiltro, erros: ["Não autorizado."] };
  }
  let atualizados = 0;
  let novos = 0;
  const erros: string[] = [];
  for (const oferta of ofertas) {
    const res = await subirParaLoja(oferta);
    if (res.ok) {
      if (res.atualizado) atualizados++;
      if (res.novo) novos++;
    } else if (res.erro) {
      erros.push(`${oferta.nome}: ${res.erro}`);
    }
  }
  return {
    ok: erros.length === 0,
    atualizados,
    novos,
    ignorados: totalIgnoradosPorFiltro,
    erros,
  };
}

/**
 * Salva a configuração global da promoção de Ofertas Especiais (nome + data final).
 * Se nome ou dataFinal forem vazios, limpa a promoção atual (null).
 */
export async function salvarPromocaoOfertasEspeciais(nome: string, dataFinalIso: string | null) {
  const nomeTrim = nome.trim();
  const valor =
    nomeTrim && dataFinalIso
      ? { nome: nomeTrim, dataFinal: dataFinalIso }
      : null;
  const res = await setLojaConfig("ofertas_especiais", valor);
  return res;
}

/** Retorna a promoção atual de Ofertas Especiais (se houver). */
export async function obterPromocaoOfertasEspeciais() {
  const valor = await getLojaConfig("ofertas_especiais");
  return valor;
}

/**
 * Busca um jogo pela URL da página do produto na PlayStation Store.
 * Aplica as mesmas regras de preço (revenda + .99) e converte a descrição para HTML estilo PS.
 * Se descricaoManual for informado, usa em vez da descrição extraída da página.
 */
export async function buscarJogoPorUrl(
  url: string,
  descricaoManual?: string
): Promise<{
  ok: boolean;
  jogo: JogoImportado | null;
  erro?: string;
}> {
  const urlNorm = url?.trim();
  if (!urlNorm) return { ok: false, jogo: null, erro: "Informe a URL do jogo." };
  const res = await buscarJogoPlayStation(urlNorm);
  if (!res.ok || !res.jogo) {
    return { ok: false, jogo: null, erro: res.erro ?? "Não foi possível obter os dados do jogo." };
  }
  const j = res.jogo;
  const precoCusto = calcularPrecoCusto(j.preco_original);
  const precoPromocional = calcularPrecoPromocionalAPartirDoCusto(precoCusto);
  const rawDesc = (descricaoManual?.trim() || j.descricao_raw) ?? "";
  const descricao_html = rawDesc ? descricaoPlayStationParaHtml(rawDesc) : "";
  const jogo: JogoImportado = {
    id_externo: j.id_externo,
    nome: j.nome,
    imagem_url: j.imagem_url,
    preco_original: j.preco_original,
    preco_com_margem: precoPromocional,
    url_origem: urlNorm,
    descricao_html,
    descricao_raw: j.descricao_raw ?? undefined,
  };
  return { ok: true, jogo };
}

/**
 * Importa um jogo (página de produto) para a loja: cria ou atualiza com nome, preço (regras de revenda), imagem e descrição.
 * Se descricaoRaw for informado, converte para HTML (estilo editor); senão usa jogo.descricao_html.
 */
export async function importarJogo(
  jogo: JogoImportado,
  descricaoRaw?: string
): Promise<ResultadoImportacao> {
  if (!(await validateAdminSession())) {
    return { ok: false, erro: "Não autorizado." };
  }
  const descricaoFinal =
    descricaoRaw?.trim() ? descricaoPlayStationParaHtml(descricaoRaw.trim()) : (jogo.descricao_html || "");
  const supabase = createAdminClient();
  const existente = await buscarProdutoExistente(supabase, jogo.id_externo, jogo.nome);
  const imagemUrl = await obterMelhorImagem(jogo.nome, jogo.imagem_url || null);
  const custoRegistrado = Math.round((jogo.preco_original * 0.5) * 100) / 100;

  if (existente) {
    const { data: atual } = await supabase
      .from("produtos_loja")
      .select("preco_custo")
      .eq("id", existente.id)
      .single();
    const custoAnterior = atual?.preco_custo ?? null;
    const { error } = await supabase
      .from("produtos_loja")
      .update({
        preco_custo_anterior: custoAnterior,
        preco_custo: custoRegistrado,
        preco: jogo.preco_com_margem,
        preco_promocional: jogo.preco_com_margem,
        imagem_url: imagemUrl ?? undefined,
        descricao: descricaoFinal || null,
        url_origem: jogo.url_origem || null,
      })
      .eq("id", existente.id);
    if (error) {
      console.error("Erro ao atualizar produto:", error);
      return { ok: false, erro: error.message };
    }
    return { ok: true, atualizado: true };
  }

  const slug = jogo.nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const idExterno = jogo.id_externo || `imp-${Date.now()}-${slug.slice(0, 20)}`;

  const { error } = await supabase.from("produtos_loja").insert({
    nome: jogo.nome,
    imagem_url: imagemUrl,
    preco_original: jogo.preco_original,
    preco: jogo.preco_com_margem,
    id_externo: idExterno,
    url_origem: jogo.url_origem || null,
    ativo: true,
    pendente_info: false,
    descricao: descricaoFinal || null,
    preco_custo: custoRegistrado,
    preco_promocional: jogo.preco_com_margem,
    gerenciar_estoque: false,
    quantidade_estoque: 0,
    slug: slug || null,
    categoria_id: null,
    subcategoria_id: null,
  });

  if (error) {
    console.error("Erro ao salvar produto:", error);
    return { ok: false, erro: error.message };
  }
  return { ok: true, novo: true };
}
