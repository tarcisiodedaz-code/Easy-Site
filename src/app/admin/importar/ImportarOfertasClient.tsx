"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  buscarOfertas,
  subirParaLoja,
  importarTodos,
  buscarJogoPorUrl,
  importarJogo,
  salvarPromocaoOfertasEspeciais,
  obterPromocaoOfertasEspeciais,
} from "./actions";
import type { OfertaImportada, JogoImportado } from "@/types/importar";
import { DateTimeInputBR } from "@/components/DateTimeInputBR";
import { calcularPrecoCusto, calcularPrecoPromocionalAPartirDoCusto } from "@/lib/preco-revenda";

const URL_PLAYSTATION =
  "https://store.playstation.com/pt-br/category/3f772501-f6f8-49b7-abac-874a88ca4897/1";
const URL_JOGO_EXEMPLO =
  "https://store.playstation.com/pt-br/product/EP3969-PPSA11386_00-007FIRSTLIGHT000";

type ProdutoLoja = {
  id: string;
  nome: string;
  preco: number;
  ativo: boolean;
  estoque: number | null;
};

type StatusOferta = "novo" | "melhor_ps" | "melhor_estoque" | "igual";

function normalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buscarProdutoSimilar(nomeOferta: string, produtosLoja: ProdutoLoja[]): ProdutoLoja | null {
  const nomeLower = nomeOferta.toLowerCase().trim();
  for (const p of produtosLoja) {
    if (p.nome.toLowerCase().trim() === nomeLower) return p;
  }
  const nomeNorm = normalizarNome(nomeOferta);
  for (const p of produtosLoja) {
    if (normalizarNome(p.nome) === nomeNorm) return p;
  }
  const palavrasOferta = nomeNorm.split(" ").filter((w) => w.length > 2);
  if (palavrasOferta.length < 2) return null;
  let melhor: ProdutoLoja | null = null;
  let melhorScore = 0;
  for (const p of produtosLoja) {
    const palavrasProduto = normalizarNome(p.nome).split(" ").filter((w) => w.length > 2);
    let matches = 0;
    for (const pal of palavrasOferta) {
      if (palavrasProduto.some((pw) => pw === pal || pw.includes(pal) || pal.includes(pw))) matches++;
    }
    const score = matches / Math.max(palavrasOferta.length, palavrasProduto.length);
    if (score <= 0.6 || score <= melhorScore) continue;
    // Evitar match quando a oferta tem palavra que indica outro jogo (ex: "God of War Ragnarök" ≠ "GOD OF WAR")
    const ofertaTemPalavraQueProdutoNaoTem = palavrasOferta.some(
      (po) => !palavrasProduto.some((pp) => pp === po || pp.includes(po) || po.includes(pp))
    );
    if (ofertaTemPalavraQueProdutoNaoTem) continue;
    melhorScore = score;
    melhor = p;
  }
  return melhor;
}

function getStatusLabel(status: StatusOferta): { texto: string; cor: string } {
  switch (status) {
    case "novo":
      return { texto: "Novo Produto", cor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    case "melhor_ps":
      return { texto: "Melhor preço PlayStation", cor: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    case "melhor_estoque":
      return { texto: "Melhor preço Estoque", cor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    case "igual":
      return { texto: "Preços Iguais", cor: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" };
    default:
      return { texto: "-", cor: "bg-zinc-700" };
  }
}

type Props = { produtosLoja: ProdutoLoja[] };

export default function ImportarOfertasClient({ produtosLoja }: Props) {
  const router = useRouter();
  const [url, setUrl] = useState(URL_PLAYSTATION);
  const [numPaginas, setNumPaginas] = useState(1);
  const [ofertas, setOfertas] = useState<OfertaImportada[]>([]);
  const [ignoradosPorFiltro, setIgnoradosPorFiltro] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [subindoId, setSubindoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [resumo, setResumo] = useState<{
    atualizados: number;
    novos: number;
    ignorados: number;
    erros: string[];
  } | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const [urlJogo, setUrlJogo] = useState(URL_JOGO_EXEMPLO);
  const [descricaoManual, setDescricaoManual] = useState("");
  const [jogoPreview, setJogoPreview] = useState<JogoImportado | null>(null);
  const [loadingJogo, setLoadingJogo] = useState(false);
  const [importandoJogo, setImportandoJogo] = useState(false);
  const [erroJogo, setErroJogo] = useState<string | null>(null);
  const [msgJogo, setMsgJogo] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [jogoNomeEdit, setJogoNomeEdit] = useState("");
  const [jogoPrecoEdit, setJogoPrecoEdit] = useState("");
  const [jogoPrecoOriginalEdit, setJogoPrecoOriginalEdit] = useState("");

  const [promoNome, setPromoNome] = useState("");
  const [promoFim, setPromoFim] = useState("");
  const [salvandoPromo, setSalvandoPromo] = useState(false);
  const [msgPromo, setMsgPromo] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const [editarProdutoId, setEditarProdutoId] = useState<string | null>(null);
  const [editarProdutoNome, setEditarProdutoNome] = useState("");
  const [criarItem, setCriarItem] = useState<OfertaImportada | null>(null);

  useEffect(() => {
    obterPromocaoOfertasEspeciais()
      .then((config) => {
        if (config && typeof config === "object" && "dataFinal" in config) {
          const c = config as { nome?: string; dataFinal?: string };
          setPromoNome(c.nome ?? "");
          if (c.dataFinal) setPromoFim(c.dataFinal);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "fechar-modal-criar") {
        setCriarItem(null);
        router.refresh();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  function calcularPrecoVendaAutomatico(precoOriginalStr: string): string {
    const precoOriginal = parseFloat(precoOriginalStr.replace(",", "."));
    if (!precoOriginal || precoOriginal <= 0) return "";
    const precoCusto = calcularPrecoCusto(precoOriginal);
    const precoVenda = calcularPrecoPromocionalAPartirDoCusto(precoCusto);
    return precoVenda.toFixed(2).replace(".", ",");
  }

  function handlePrecoOriginalChange(valor: string) {
    setJogoPrecoOriginalEdit(valor);
    const calc = calcularPrecoVendaAutomatico(valor);
    if (calc) setJogoPrecoEdit(calc);
  }

  function getStatus(oferta: OfertaImportada): { status: StatusOferta; produtoLoja: ProdutoLoja | null } {
    const produtoLoja = buscarProdutoSimilar(oferta.nome, produtosLoja);
    if (!produtoLoja) return { status: "novo", produtoLoja: null };
    const precoLoja = produtoLoja.preco;
    const precoPS = oferta.preco_promocional;
    const diff = Math.abs(precoPS - precoLoja);
    if (diff < 0.5) return { status: "igual", produtoLoja };
    if (precoPS < precoLoja) return { status: "melhor_ps", produtoLoja };
    return { status: "melhor_estoque", produtoLoja };
  }

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErroBusca(null);
    setOfertas([]);
    setIgnoradosPorFiltro(0);
    setResumo(null);
    setSelecionados(new Set());
    const res = await buscarOfertas(url, 0, numPaginas);
    setLoading(false);
    if (res.ok) {
      setOfertas(res.ofertas);
      setIgnoradosPorFiltro(res.ignoradosPorFiltro);
    } else {
      setErroBusca(res.erro ?? "Erro ao buscar ofertas.");
    }
  }

  async function handleSubir(oferta: OfertaImportada) {
    setSubindoId(oferta.id_externo);
    setMensagem(null);
    setResumo(null);
    const res = await subirParaLoja(oferta);
    setSubindoId(null);
    if (res.ok) {
      if (res.atualizado) setMensagem({ tipo: "ok", texto: `"${oferta.nome}" — preço atualizado na loja!` });
      else setMensagem({ tipo: "ok", texto: `"${oferta.nome}" adicionado à loja (pendente de info).` });
    } else {
      setMensagem({ tipo: "erro", texto: res.erro ?? "Erro ao salvar." });
    }
    router.refresh();
  }

  async function handleImportarTodos() {
    if (ofertas.length === 0) return;
    setSubindoId("__todos__");
    setMensagem(null);
    setResumo(null);
    const res = await importarTodos(ofertas, ignoradosPorFiltro);
    setSubindoId(null);
    setResumo({
      atualizados: res.atualizados,
      novos: res.novos,
      ignorados: res.ignorados,
      erros: res.erros,
    });
    if (res.erros.length > 0) {
      setMensagem({ tipo: "erro", texto: `${res.erros.length} erro(s) durante a importação.` });
    } else {
      setMensagem({
        tipo: "ok",
        texto: `${res.atualizados} produtos atualizados, ${res.novos} novos criados (pendentes de info) e ${res.ignorados} itens ignorados por filtro.`,
      });
    }
    router.refresh();
  }

  async function handleImportarSelecionados() {
    if (selecionados.size === 0) return;
    const ofertasSelecionadas = ofertas.filter((o) => selecionados.has(o.id_externo));
    if (ofertasSelecionadas.length === 0) return;
    setSubindoId("__selecionados__");
    setMensagem(null);
    setResumo(null);
    const res = await importarTodos(ofertasSelecionadas, 0);
    setSubindoId(null);
    setSelecionados(new Set());
    setResumo({
      atualizados: res.atualizados,
      novos: res.novos,
      ignorados: res.ignorados,
      erros: res.erros,
    });
    if (res.erros.length > 0) {
      setMensagem({ tipo: "erro", texto: `${res.erros.length} erro(s) durante a importação.` });
    } else {
      setMensagem({
        tipo: "ok",
        texto: `${res.atualizados} produtos atualizados e ${res.novos} novos criados (pendentes de info).`,
      });
    }
    router.refresh();
  }

  function toggleSelecionado(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelecionarTodos() {
    if (selecionados.size === ofertas.length) setSelecionados(new Set());
    else setSelecionados(new Set(ofertas.map((o) => o.id_externo)));
  }

  async function handleSalvarPromocao(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoPromo(true);
    setMsgPromo(null);
    try {
      const dataIso = promoFim && !Number.isNaN(Date.parse(promoFim)) ? promoFim : null;
      const res = await salvarPromocaoOfertasEspeciais(promoNome, dataIso);
      if (res.ok) {
        setMsgPromo({ tipo: "ok", texto: "Promoção de Ofertas Especiais salva. O contador do menu usará essa data." });
      } else {
        setMsgPromo({ tipo: "erro", texto: res.error ?? "Erro ao salvar promoção." });
      }
    } catch {
      setMsgPromo({ tipo: "erro", texto: "Erro ao salvar promoção." });
    } finally {
      setSalvandoPromo(false);
    }
  }

  async function handleBuscarJogo(e: React.FormEvent) {
    e.preventDefault();
    setLoadingJogo(true);
    setErroJogo(null);
    setJogoPreview(null);
    setMsgJogo(null);
    const res = await buscarJogoPorUrl(urlJogo, descricaoManual || undefined);
    setLoadingJogo(false);
    if (res.ok && res.jogo) {
      setJogoPreview(res.jogo);
      setJogoNomeEdit(res.jogo.nome);
      setJogoPrecoEdit(res.jogo.preco_com_margem.toFixed(2).replace(".", ","));
      setJogoPrecoOriginalEdit(res.jogo.preco_original.toFixed(2).replace(".", ","));
      if (res.jogo.descricao_raw) setDescricaoManual(res.jogo.descricao_raw);
    } else {
      setErroJogo(res.erro ?? "Não foi possível buscar o jogo.");
    }
  }

  async function handleImportarJogo() {
    if (!jogoPreview) return;
    setImportandoJogo(true);
    setMsgJogo(null);
    const precoEditado = parseFloat(jogoPrecoEdit.replace(",", ".")) || jogoPreview.preco_com_margem;
    const precoOriginalEditado = parseFloat(jogoPrecoOriginalEdit.replace(",", ".")) || jogoPreview.preco_original;
    const jogoComEdicoes: JogoImportado = {
      ...jogoPreview,
      nome: jogoNomeEdit || jogoPreview.nome,
      preco_com_margem: precoEditado,
      preco_original: precoOriginalEditado,
    };
    const res = await importarJogo(jogoComEdicoes, descricaoManual || undefined);
    setImportandoJogo(false);
    if (res.ok) {
      setMsgJogo({
        tipo: "ok",
        texto: res.atualizado
          ? `"${jogoComEdicoes.nome}" atualizado na loja (preço e descrição).`
          : `"${jogoComEdicoes.nome}" adicionado à loja.`,
      });
      setJogoPreview(null);
      setDescricaoManual("");
      setJogoNomeEdit("");
      setJogoPrecoEdit("");
      setJogoPrecoOriginalEdit("");
    } else {
      setMsgJogo({ tipo: "erro", texto: res.erro ?? "Erro ao importar." });
    }
  }

  function formatBRL(n: number) {
    return `R$ ${n.toFixed(2).replace(".", ",")}`;
  }

  return (
    <>
      {/* Importar jogo (página do produto) */}
      <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-2 text-xl font-semibold text-white">Importar jogo (página do produto)</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Cole a URL da página do jogo na PlayStation Store. Serão importados: nome, preço (revenda + .99), capa e descrição no mesmo estilo da PS Store.
        </p>
        <form onSubmit={handleBuscarJogo} className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="urlJogo" className="sr-only">URL do jogo</label>
              <input
                id="urlJogo"
                type="url"
                value={urlJogo}
                onChange={(e) => setUrlJogo(e.target.value)}
                placeholder={URL_JOGO_EXEMPLO}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loadingJogo}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {loadingJogo ? "Buscando…" : "Buscar jogo"}
            </button>
          </div>
          {jogoPreview && (
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
              <div className="flex flex-wrap gap-4">
                {jogoPreview.imagem_url && (
                  <div className="relative h-28 w-22 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                    <Image
                      src={jogoPreview.imagem_url}
                      alt={jogoPreview.nome}
                      fill
                      className="object-cover"
                      sizes="88px"
                      unoptimized
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Nome do jogo</label>
                    <input
                      type="text"
                      value={jogoNomeEdit}
                      onChange={(e) => setJogoNomeEdit(e.target.value)}
                      className="w-full rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Preço original Sony (R$)</label>
                      <input
                        type="text"
                        value={jogoPrecoOriginalEdit}
                        onChange={(e) => handlePrecoOriginalChange(e.target.value)}
                        placeholder="0,00"
                        className="w-full rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                      <p className="mt-1 text-[10px] text-zinc-500">Ao alterar, recalcula o preço de venda</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Preço de venda (R$)</label>
                      <input
                        type="text"
                        value={jogoPrecoEdit}
                        onChange={(e) => setJogoPrecoEdit(e.target.value)}
                        placeholder="0,00"
                        className="w-full rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div>
            <label htmlFor="descricaoManual" className="mb-1 block text-sm text-zinc-400">
              Descrição (opcional) — se a página não retornar a descrição, cole aqui o texto da PS Store
            </label>
            <textarea
              id="descricaoManual"
              value={descricaoManual}
              onChange={(e) => setDescricaoManual(e.target.value)}
              rows={4}
              placeholder="Cole o texto da descrição do jogo como aparece na PlayStation Store..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          {jogoPreview && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleImportarJogo}
                disabled={importandoJogo}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {importandoJogo ? "Importando…" : "Importar para a loja"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setJogoPreview(null);
                  setDescricaoManual("");
                  setJogoNomeEdit("");
                  setJogoPrecoEdit("");
                  setJogoPrecoOriginalEdit("");
                }}
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Cancelar
              </button>
            </div>
          )}
        </form>
        {erroJogo && <p className="mt-3 text-sm text-red-400">{erroJogo}</p>}
        {msgJogo && (
          <div
            className={`mt-3 rounded-lg border px-4 py-3 text-sm ${
              msgJogo.tipo === "ok"
                ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-200"
                : "border-red-900/50 bg-red-950/30 text-red-200"
            }`}
          >
            {msgJogo.texto}
          </div>
        )}
      </section>

      {/* Promoção Ofertas Especiais */}
      <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="mb-2 text-xl font-semibold text-white">Promoção das Ofertas Especiais</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Defina um nome e a data/hora final da promoção que aparece no botão <strong>OFERTAS ESPECIAS</strong> do topo da loja.
        </p>
        {msgPromo && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              msgPromo.tipo === "ok"
                ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-200"
                : "border-red-900/50 bg-red-950/30 text-red-200"
            }`}
          >
            {msgPromo.texto}
          </div>
        )}
        <form onSubmit={handleSalvarPromocao} className="grid gap-4 sm:grid-cols-[2fr,1.5fr,auto]">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Nome da promoção</label>
            <input
              type="text"
              value={promoNome}
              onChange={(e) => setPromoNome(e.target.value)}
              placeholder="Ex.: Semana do Cliente, Ofertas de Fim de Semana..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Data e hora de término</label>
            <DateTimeInputBR
              value={promoFim}
              onChange={setPromoFim}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={salvandoPromo}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {salvandoPromo ? "Salvando…" : "Salvar promoção"}
            </button>
          </div>
        </form>
      </section>

      {/* Ofertas em lote */}
      <form onSubmit={handleBuscar} className="mb-10 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">Importar ofertas em lote</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="url" className="mb-2 block text-sm font-medium text-zinc-300">URL da página de ofertas</label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={URL_PLAYSTATION}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="mt-1 text-xs text-zinc-500">Use a URL da categoria com /1 no final. Paginação: /2, /3, … /186.</p>
          </div>
          <div>
            <label htmlFor="numPaginas" className="mb-2 block text-sm font-medium text-zinc-300">Quantas páginas buscar</label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                id="numPaginas"
                type="number"
                min={1}
                max={186}
                value={numPaginas}
                onChange={(e) => setNumPaginas(Math.min(186, Math.max(1, Number(e.target.value) || 1)))}
                className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-zinc-400">de 186</span>
              <button
                type="button"
                onClick={() => setNumPaginas(186)}
                className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Carregar todas (186)
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? `Buscando ofertas (até ${numPaginas} página${numPaginas > 1 ? "s" : ""})…` : "Buscar ofertas"}
          </button>
          {ofertas.length > 0 && (
            <span className="text-sm text-zinc-500">({produtosLoja.length} produtos na loja)</span>
          )}
        </div>
      </form>

      {erroBusca && (
        <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-200">
          {erroBusca}
        </div>
      )}

      {mensagem && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 ${
            mensagem.tipo === "ok"
              ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-200"
              : "border-amber-900/50 bg-amber-950/30 text-amber-200"
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      {resumo && (
        <div className="mb-6 rounded-xl border border-zinc-700 bg-zinc-900/80 p-4">
          <h3 className="mb-2 font-semibold text-white">Resumo da importação</h3>
          <p className="text-zinc-300">
            <strong>{resumo.atualizados}</strong> produtos atualizados, <strong>{resumo.novos}</strong> novos criados (pendentes de info) e <strong>{resumo.ignorados}</strong> itens ignorados por filtro.
          </p>
          {resumo.erros.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-amber-400">
              {resumo.erros.slice(0, 5).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {resumo.erros.length > 5 && <li>… e mais {resumo.erros.length - 5} erro(s)</li>}
            </ul>
          )}
        </div>
      )}

      {/* Tabela de conferência (estilo Estoque → Loja) */}
      {ofertas.length > 0 && (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">Tabela de conferência</h2>
            {ignoradosPorFiltro > 0 && (
              <span className="text-sm text-zinc-500">
                {ignoradosPorFiltro} itens ignorados por filtro (Expansão, Season Pass, etc.)
              </span>
            )}
            <div className="flex flex-wrap gap-2">
              {selecionados.size > 0 && (
                <button
                  type="button"
                  onClick={handleImportarSelecionados}
                  disabled={!!subindoId}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {subindoId === "__selecionados__" ? "Importando…" : `Importar selecionados (${selecionados.size})`}
                </button>
              )}
              <button
                type="button"
                onClick={handleImportarTodos}
                disabled={!!subindoId}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {subindoId === "__todos__" ? "Importando…" : `Importar todos (${ofertas.length})`}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-zinc-700">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-700 bg-zinc-800/80 text-zinc-300">
                <tr>
                  <th className="p-3">
                    <input
                      type="checkbox"
                      checked={selecionados.size === ofertas.length && ofertas.length > 0}
                      onChange={toggleSelecionarTodos}
                      className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="p-3">Imagem</th>
                  <th className="p-3">Jogo</th>
                  <th className="p-3 text-right">Custo (50% verde)</th>
                  <th className="p-3 text-right">Preço venda</th>
                  <th className="p-3 text-right">Preço promocional</th>
                  <th className="p-3 text-right">Preço Loja Atual</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700/50">
                {ofertas.map((oferta) => {
                  const { status, produtoLoja } = getStatus(oferta);
                  const statusInfo = getStatusLabel(status);
                  const matchPorSimilaridade = produtoLoja && normalizarNome(produtoLoja.nome) !== normalizarNome(oferta.nome);
                  return (
                    <tr key={oferta.id_externo} className="bg-zinc-800/30 hover:bg-zinc-800/60">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selecionados.has(oferta.id_externo)}
                          onChange={() => toggleSelecionado(oferta.id_externo)}
                          className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-3">
                        <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-zinc-800">
                          <Image
                            src={oferta.imagem_url}
                            alt={oferta.nome}
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="min-w-0">
                          {produtoLoja ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditarProdutoId(produtoLoja.id);
                                setEditarProdutoNome(produtoLoja.nome);
                              }}
                              className="text-left font-medium text-white underline decoration-zinc-500 underline-offset-2 hover:decoration-emerald-400 hover:text-emerald-400"
                              title="Clique para editar produto na loja"
                            >
                              {oferta.nome}
                            </button>
                          ) : (
                            <span className="font-medium text-white">{oferta.nome}</span>
                          )}
                          {matchPorSimilaridade && (
                            <div className="mt-1 text-xs text-cyan-400">
                              ↳ Corresponde a: &quot;{produtoLoja!.nome}&quot;
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right text-zinc-400">
                        {formatBRL(oferta.preco_custo)}
                      </td>
                      <td className="p-3 text-right text-zinc-200">
                        {formatBRL(oferta.preco_venda)}
                      </td>
                      <td className="p-3 text-right font-medium text-emerald-400">
                        {formatBRL(oferta.preco_promocional)}
                      </td>
                      <td className="p-3 text-right">
                        {produtoLoja ? (
                          <span className={produtoLoja.ativo ? "text-white" : "text-zinc-500"}>
                            {formatBRL(produtoLoja.preco)}
                            {!produtoLoja.ativo && <span className="ml-1 text-xs text-zinc-500">(inativo)</span>}
                          </span>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${statusInfo.cor}`}>
                          {statusInfo.texto}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {status === "novo" ? (
                          <button
                            type="button"
                            onClick={() => setCriarItem(oferta)}
                            className="rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-500"
                            title="Abrir janela para criar produto na loja com dados da oferta"
                          >
                            Criar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSubir(oferta)}
                            disabled={!!subindoId}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition ${
                              status === "melhor_ps" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-zinc-600 hover:bg-zinc-500"
                            } disabled:opacity-50`}
                          >
                            {subindoId === oferta.id_externo ? "..." : "Importar"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Legenda */}
          <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800/30 p-4 text-sm text-zinc-400">
            <h3 className="mb-2 font-medium text-white">Legenda:</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" />
                <span>Novo Produto (não existe na loja)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
                <span>Melhor preço PlayStation (atualizar com oferta PS)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                <span>Melhor preço Estoque (preço da loja já é melhor)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-zinc-500" />
                <span>Preços iguais</span>
              </div>
            </div>
            <div className="mt-3 border-t border-zinc-700 pt-3">
              <h4 className="mb-1 font-medium text-white">Regras de importação (PlayStation):</h4>
              <ul className="list-inside list-disc space-y-1">
                <li>Custo = 50% do preço verde (com desconto) da PS Store</li>
                <li>Preço promocional = custo + faixa fixa (.99)</li>
                <li>Ao importar: atualiza custo e preço promocional; produto novo fica pendente de info</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Modal Editar produto */}
      {editarProdutoId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => e.target === e.currentTarget && setEditarProdutoId(null)}
        >
          <div
            className="flex h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-zinc-600 bg-zinc-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 px-4 py-3">
              <h3 className="truncate text-lg font-medium text-white">
                Editar: {editarProdutoNome || "Produto"}
              </h3>
              <button
                type="button"
                onClick={() => setEditarProdutoId(null)}
                className="rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-600 hover:text-white"
              >
                Fechar
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <iframe
                src={`/admin/produtos/${editarProdutoId}/editar`}
                title="Editar produto"
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar produto (pré-preenchido com dados da oferta) */}
      {criarItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => e.target === e.currentTarget && setCriarItem(null)}
        >
          <div
            className="flex h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-zinc-600 bg-zinc-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 px-4 py-3">
              <h3 className="truncate text-lg font-medium text-white">
                Criar produto — {criarItem.nome}
              </h3>
              <button
                type="button"
                onClick={() => setCriarItem(null)}
                className="rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-600 hover:text-white"
              >
                Fechar
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <iframe
                src={(() => {
                  const params: Record<string, string> = {
                    nome: criarItem.nome,
                    preco_custo: String(criarItem.preco_custo),
                    preco: String(criarItem.preco_promocional),
                    preco_promocional: String(criarItem.preco_promocional),
                    gerenciar_estoque: "false",
                    embed: "1",
                    ofertas: "1",
                  };
                  return `/admin/produtos/novo?${new URLSearchParams(params).toString()}`;
                })()}
                title="Criar produto"
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
