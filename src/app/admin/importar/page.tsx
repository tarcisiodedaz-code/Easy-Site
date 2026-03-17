"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

const URL_PLAYSTATION =
  "https://store.playstation.com/pt-br/category/3f772501-f6f8-49b7-abac-874a88ca4897/1";
const URL_JOGO_EXEMPLO =
  "https://store.playstation.com/pt-br/product/EP3969-PPSA11386_00-007FIRSTLIGHT000";

export default function AdminImportarPage() {
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

  // Importar jogo (página do produto)
  const [urlJogo, setUrlJogo] = useState(URL_JOGO_EXEMPLO);
  const [descricaoManual, setDescricaoManual] = useState("");
  const [jogoPreview, setJogoPreview] = useState<JogoImportado | null>(null);
  const [loadingJogo, setLoadingJogo] = useState(false);
  const [importandoJogo, setImportandoJogo] = useState(false);
  const [erroJogo, setErroJogo] = useState<string | null>(null);
  const [msgJogo, setMsgJogo] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  // Promoção global de Ofertas Especiais
  const [promoNome, setPromoNome] = useState("");
  const [promoFim, setPromoFim] = useState(""); // datetime-local
  const [salvandoPromo, setSalvandoPromo] = useState(false);
  const [msgPromo, setMsgPromo] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  useEffect(() => {
    // Carrega promoção atual ao abrir a página
    obterPromocaoOfertasEspeciais()
      .then((config) => {
        if (config && typeof config === "object" && "dataFinal" in config) {
          const c = config as { nome?: string; dataFinal?: string };
          setPromoNome(c.nome ?? "");
          if (c.dataFinal) {
            const d = new Date(c.dataFinal);
            const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16);
            setPromoFim(isoLocal);
          }
        }
      })
      .catch(() => {
        // ignora erros silenciosamente
      });
  }, []);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErroBusca(null);
    setOfertas([]);
    setIgnoradosPorFiltro(0);
    setResumo(null);
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
  }

  async function handleSalvarPromocao(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoPromo(true);
    setMsgPromo(null);
    try {
      const dataIso =
        promoFim && !Number.isNaN(Date.parse(promoFim))
          ? new Date(promoFim).toISOString()
          : null;
      const res = await salvarPromocaoOfertasEspeciais(promoNome, dataIso);
      if (res.ok) {
        setMsgPromo({
          tipo: "ok",
          texto: "Promoção de Ofertas Especiais salva. O contador do menu usará essa data.",
        });
      } else {
        setMsgPromo({
          tipo: "erro",
          texto: res.error ?? "Erro ao salvar promoção.",
        });
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
      if (res.jogo.descricao_raw) setDescricaoManual(res.jogo.descricao_raw);
    } else {
      setErroJogo(res.erro ?? "Não foi possível buscar o jogo.");
    }
  }

  async function handleImportarJogo() {
    if (!jogoPreview) return;
    setImportandoJogo(true);
    setMsgJogo(null);
    const res = await importarJogo(jogoPreview, descricaoManual || undefined);
    setImportandoJogo(false);
    if (res.ok) {
      setMsgJogo({
        tipo: "ok",
        texto: res.atualizado
          ? `"${jogoPreview.nome}" atualizado na loja (preço e descrição).`
          : `"${jogoPreview.nome}" adicionado à loja.`,
      });
      setJogoPreview(null);
      setDescricaoManual("");
    } else {
      setMsgJogo({ tipo: "erro", texto: res.erro ?? "Erro ao importar." });
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Importar — PlayStation Store
          </h1>
          <p className="mt-2 text-zinc-400">
            Busque ofertas em lote ou importe um jogo pela URL da página do produto (nome, preço com as mesmas regras de revenda e descrição estilo PS Store).
          </p>
        </header>

        {/* Importar um jogo (página do produto) */}
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
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                      <Image
                        src={jogoPreview.imagem_url}
                        alt={jogoPreview.nome}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{jogoPreview.nome}</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      Preço na loja: R$ {jogoPreview.preco_com_margem.toFixed(2).replace(".", ",")}
                      <span className="ml-2 text-zinc-500">
                        (orig. R$ {jogoPreview.preco_original.toFixed(2).replace(".", ",")})
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label htmlFor="descricaoManual" className="mb-1 block text-sm text-zinc-400">
                Descrição (opcional) — se a página não retornar a descrição, cole aqui o texto da PS Store (com • e títulos em maiúsculas)
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
                  onClick={() => { setJogoPreview(null); setDescricaoManual(""); }}
                  className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
              </div>
            )}
          </form>
          {erroJogo && (
            <p className="mt-3 text-sm text-red-400">{erroJogo}</p>
          )}
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

        {/* Configuração da promoção de Ofertas Especiais */}
        <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="mb-2 text-xl font-semibold text-white">Promoção das Ofertas Especiais</h2>
          <p className="mb-4 text-sm text-zinc-400">
            Defina um nome e a data/hora final da promoção que aparece no botão{" "}
            <strong>OFERTAS ESPECIAS</strong> do topo da loja. O contador e a
            exibição das ofertas usarão essa data como limite.
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
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Nome da promoção (controle interno)
              </label>
              <input
                type="text"
                value={promoNome}
                onChange={(e) => setPromoNome(e.target.value)}
                placeholder="Ex.: Semana do Cliente, Ofertas de Fim de Semana..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Data e hora de término
              </label>
              <input
                type="datetime-local"
                value={promoFim}
                onChange={(e) => setPromoFim(e.target.value)}
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
              <label htmlFor="url" className="mb-2 block text-sm font-medium text-zinc-300">
                URL da página de ofertas
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={URL_PLAYSTATION}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Use a URL da categoria com /1 no final. Paginação: só muda o número (/2, /3, … /186).
              </p>
            </div>
            <div>
              <label htmlFor="numPaginas" className="mb-2 block text-sm font-medium text-zinc-300">
                Quantas páginas buscar
              </label>
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
              <strong>{resumo.atualizados}</strong> produtos atualizados,{" "}
              <strong>{resumo.novos}</strong> novos criados (pendentes de info) e{" "}
              <strong>{resumo.ignorados}</strong> itens ignorados por filtro.
            </p>
            {resumo.erros.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-sm text-amber-400">
                {resumo.erros.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {resumo.erros.length > 5 && (
                  <li>… e mais {resumo.erros.length - 5} erro(s)</li>
                )}
              </ul>
            )}
          </div>
        )}

        {ofertas.length > 0 && (
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">Tabela de conferência</h2>
              {ignoradosPorFiltro > 0 && (
                <span className="text-sm text-zinc-500">
                  {ignoradosPorFiltro} itens ignorados por filtro (Expansão, Season Pass, etc.)
                </span>
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
            <div className="overflow-hidden rounded-xl border border-zinc-800">
              <table className="w-full border-collapse bg-zinc-900/50">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
                    <th className="p-4 font-medium">Imagem</th>
                    <th className="p-4 font-medium">Jogo</th>
                    <th className="p-4 font-medium">Seu custo (50% do verde)</th>
                    <th className="p-4 font-medium">Preço venda (½ vermelho)</th>
                    <th className="p-4 font-medium">Preço promocional</th>
                    <th className="p-4 font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {ofertas.map((oferta) => (
                    <tr
                      key={oferta.id_externo}
                      className="border-b border-zinc-800/80 transition-colors hover:bg-zinc-800/30"
                    >
                      <td className="p-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-zinc-800">
                          <Image
                            src={oferta.imagem_url}
                            alt={oferta.nome}
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized
                          />
                        </div>
                      </td>
                      <td className="p-4 font-medium text-white">{oferta.nome}</td>
                      <td className="p-4 text-zinc-300">
                        R$ {oferta.preco_custo.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="p-4 text-zinc-200">
                        R$ {oferta.preco_venda.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="p-4 font-medium text-emerald-400">
                        R$ {oferta.preco_promocional.toFixed(2).replace(".", ",")}
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleSubir(oferta)}
                          disabled={!!subindoId}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                        >
                          {subindoId === oferta.id_externo ? "Salvando…" : "Subir para minha Loja"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
