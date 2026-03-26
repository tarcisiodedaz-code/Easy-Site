"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { importarDoEstoque } from "./actions";
import { formatBRL, calcularParcela } from "@/lib/utils/formatters";
import { calcularPrecoPromocionalAPartirDoCusto } from "@/lib/preco-revenda";

const STORAGE_KEY_ESTOQUE = "estoque-loja-cache";
const STORAGE_KEY_REGISTRO = "estoque-loja-registro-importacoes";
const MAX_REGISTRO = 100;

type RegistroImportacao = {
  jogo_id: string;
  game_name: string;
  tipo: string;
  dataHora: string;
};

type EstoqueAgrupado = {
  jogo_id: string;
  game_name: string;
  custo_medio: number;
  custo_medio_ps4?: number;
  custo_medio_ps5?: number;
  qtd_ps4: number;
  qtd_ps5: number;
  qtd_total: number;
  slots: {
    slot_id: string;
    console: string | null;
    tipo: string | null;
    custo_vaga: number | null;
  }[];
};

type ProdutoLoja = {
  id: string;
  nome: string;
  preco: number;
  ativo: boolean;
  estoque: number | null;
};

type Props = {
  produtosLoja: ProdutoLoja[];
};

type StatusJogo = "novo" | "meu_melhor" | "ps_melhor" | "igual" | "atualizar";

function normalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buscarProdutoSimilar(
  nomeEstoque: string,
  produtosLoja: ProdutoLoja[]
): ProdutoLoja | null {
  const nomeLower = nomeEstoque.toLowerCase().trim();
  for (const p of produtosLoja) {
    if (p.nome.toLowerCase().trim() === nomeLower) {
      return p;
    }
  }
  
  const nomeNormalizado = normalizarNome(nomeEstoque);
  for (const p of produtosLoja) {
    if (normalizarNome(p.nome) === nomeNormalizado) {
      return p;
    }
  }
  
  const palavrasEstoque = nomeNormalizado.split(" ").filter((w) => w.length > 2);
  if (palavrasEstoque.length < 2) return null;
  
  let melhorMatch: ProdutoLoja | null = null;
  let melhorScore = 0;
  
  for (const p of produtosLoja) {
    const nomeProduto = normalizarNome(p.nome);
    const palavrasProduto = nomeProduto.split(" ").filter((w) => w.length > 2);
    
    let matches = 0;
    for (const palavra of palavrasEstoque) {
      if (palavrasProduto.some((pw) => pw === palavra || pw.includes(palavra) || palavra.includes(pw))) {
        matches++;
      }
    }
    
    const score = matches / Math.max(palavrasEstoque.length, palavrasProduto.length);
    
    if (score > 0.6 && score > melhorScore) {
      melhorScore = score;
      melhorMatch = p;
    }
  }
  
  return melhorMatch;
}

function loadEstoqueFromStorage(): EstoqueAgrupado[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_ESTOQUE);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EstoqueAgrupado[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadRegistroFromStorage(): RegistroImportacao[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_REGISTRO);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RegistroImportacao[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function EstoqueLojaClient({ produtosLoja }: Props) {
  const [estoque, setEstoque] = useState<EstoqueAgrupado[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [importando, setImportando] = useState<Set<string>>(new Set());
  const [mensagens, setMensagens] = useState<Record<string, { tipo: string; texto: string }>>({});
  const [precosEditados, setPrecosEditados] = useState<Record<string, string>>({});
  const [filtro, setFiltro] = useState("");
  const [registroImportacoes, setRegistroImportacoes] = useState<RegistroImportacao[]>([]);
  const [hidratado, setHidratado] = useState(false);
  const [editarProdutoId, setEditarProdutoId] = useState<string | null>(null);
  const [editarProdutoNome, setEditarProdutoNome] = useState<string>("");
  const [criarItem, setCriarItem] = useState<EstoqueAgrupado | null>(null);
  const router = useRouter();

  useEffect(() => {
    setEstoque(loadEstoqueFromStorage());
    setRegistroImportacoes(loadRegistroFromStorage());
    setHidratado(true);
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

  const carregarEstoque = useCallback(async () => {
    setErro(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 0));
    try {
      const res = await fetch("/api/estoque-externo", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data.erro || `Erro ${res.status}: ${res.statusText}`);
        return;
      }
      if (data.erro) {
        setErro(data.erro);
        return;
      }
      const lista = data.estoque || [];
      setEstoque(lista);
      try {
        sessionStorage.setItem(STORAGE_KEY_ESTOQUE, JSON.stringify(lista));
      } catch {
        /* ignore */
      }
      setSelecionados(new Set());
      setMensagens({});
      setPrecosEditados({});
    } catch (e) {
      setErro("Erro ao carregar estoque: " + String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  function salvarRegistro(registros: RegistroImportacao[]) {
    setRegistroImportacoes(registros);
    try {
      sessionStorage.setItem(STORAGE_KEY_REGISTRO, JSON.stringify(registros));
    } catch {
      /* ignore */
    }
  }

  function limparRegistro() {
    salvarRegistro([]);
  }

  function getStatus(item: EstoqueAgrupado): { status: StatusJogo; produtoLoja: ProdutoLoja | null } {
    const produtoLoja = buscarProdutoSimilar(item.game_name, produtosLoja);
    const precoCalculado = calcularPrecoPromocionalAPartirDoCusto(item.custo_medio);

    if (!produtoLoja) {
      return { status: "novo", produtoLoja: null };
    }

    const precoLoja = produtoLoja.preco;
    const diff = Math.abs(precoCalculado - precoLoja);

    if (diff < 0.5) {
      return { status: "igual", produtoLoja };
    }
    if (precoCalculado < precoLoja) {
      return { status: "meu_melhor", produtoLoja };
    }
    return { status: "atualizar", produtoLoja };
  }

  function getStatusLabel(status: StatusJogo): { texto: string; cor: string } {
    switch (status) {
      case "novo":
        return { texto: "Novo Produto", cor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
      case "meu_melhor":
        return { texto: "Seu Preço é Melhor", cor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
      case "atualizar":
        return { texto: "Atualizar Preço", cor: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
      case "igual":
        return { texto: "Preços Iguais", cor: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" };
      default:
        return { texto: "-", cor: "bg-zinc-700" };
    }
  }

  function toggleSelecionado(jogoId: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(jogoId)) {
        next.delete(jogoId);
      } else {
        next.add(jogoId);
      }
      return next;
    });
  }

  function toggleSelecionarTodos() {
    if (selecionados.size === estoqueFiltrado.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(estoqueFiltrado.map((e) => e.jogo_id)));
    }
  }

  async function handleImportar(item: EstoqueAgrupado) {
    setImportando((prev) => new Set(prev).add(item.jogo_id));
    try {
      const precoEditadoStr = precosEditados[item.jogo_id];
      const precoEditado = precoEditadoStr
        ? parseFloat(precoEditadoStr.replace(",", "."))
        : undefined;

      const res = await importarDoEstoque({
        jogo_id: item.jogo_id,
        game_name: item.game_name,
        custo_medio: item.custo_medio,
        custo_medio_ps4: item.custo_medio_ps4,
        custo_medio_ps5: item.custo_medio_ps5,
        qtd_ps4: item.qtd_ps4,
        qtd_ps5: item.qtd_ps5,
        qtd_total: item.qtd_total,
        preco_venda_editado: precoEditado && precoEditado > 0 ? precoEditado : undefined,
      });

      setMensagens((prev) => ({
        ...prev,
        [item.jogo_id]: {
          tipo: res.sucesso ? res.tipo : "erro",
          texto: res.mensagem,
        },
      }));
      if (res.sucesso) {
        const novoRegistro: RegistroImportacao = {
          jogo_id: item.jogo_id,
          game_name: item.game_name,
          tipo: res.tipo ?? "importado",
          dataHora: new Date().toISOString(),
        };
        setRegistroImportacoes((prev) => {
          const next = [novoRegistro, ...prev].slice(0, MAX_REGISTRO);
          try {
            sessionStorage.setItem(STORAGE_KEY_REGISTRO, JSON.stringify(next));
          } catch {
            /* ignore */
          }
          return next;
        });
      }
      return res.sucesso;
    } catch (e) {
      setMensagens((prev) => ({
        ...prev,
        [item.jogo_id]: { tipo: "erro", texto: String(e) },
      }));
      return false;
    } finally {
      setImportando((prev) => {
        const next = new Set(prev);
        next.delete(item.jogo_id);
        return next;
      });
    }
  }

  async function handleImportarSelecionados() {
    const itens = estoqueFiltrado.filter((e) => selecionados.has(e.jogo_id));
    for (const item of itens) {
      await handleImportar(item);
    }
  }

  function handlePrecoChange(jogoId: string, valor: string) {
    setPrecosEditados((prev) => ({ ...prev, [jogoId]: valor }));
  }

  const estoqueFiltrado = useMemo(() => {
    if (!filtro.trim()) return estoque;
    const termo = filtro.toLowerCase().trim();
    return estoque.filter((e) => e.game_name.toLowerCase().includes(termo));
  }, [estoque, filtro]);

  const jaImportadoIds = useMemo(
    () => new Set(registroImportacoes.map((r) => r.jogo_id)),
    [registroImportacoes]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (loading) return;
            setErro(null);
            limparRegistro();
            setLoading(true);
            void carregarEstoque();
          }}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          aria-busy={loading}
        >
          {loading ? "Carregando..." : "Carregar Estoque"}
        </button>
        {estoque.length > 0 && (
          <span className="text-xs text-zinc-500">
            Dados mantidos até você carregar novamente. O registro &quot;Já importado&quot; é zerado ao carregar.
          </span>
        )}
        <span className="text-xs text-zinc-500">
          ({produtosLoja.length} produtos na loja)
        </span>

        {selecionados.size > 0 && (
          <button
            onClick={handleImportarSelecionados}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Importar Selecionados ({selecionados.size})
          </button>
        )}

        {estoque.length > 0 && (
          <input
            type="text"
            placeholder="Filtrar por nome..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-400 focus:border-emerald-500 focus:outline-none"
          />
        )}
      </div>

      {erro && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {erro}
        </div>
      )}

      {hidratado && estoque.length === 0 && !loading && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-8 text-center text-zinc-400">
          <p>Clique em &quot;Carregar Estoque&quot; para buscar os produtos do seu sistema.</p>
          <p className="mt-2 text-xs">Os dados carregados permanecem até você carregar novamente.</p>
        </div>
      )}

      {estoqueFiltrado.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-zinc-700">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-700 bg-zinc-800/80 text-zinc-300">
              <tr>
                <th className="p-3">
                  <input
                    type="checkbox"
                    checked={selecionados.size === estoqueFiltrado.length && estoqueFiltrado.length > 0}
                    onChange={toggleSelecionarTodos}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
                  />
                </th>
                <th className="p-3">Jogo</th>
                <th className="p-3 text-center">PS4</th>
                <th className="p-3 text-center">PS5</th>
                <th className="p-3 text-center">Total</th>
                <th className="p-3 text-right">Custo PS4</th>
                <th className="p-3 text-right">Custo PS5</th>
                <th className="p-3 text-right">Preço Calculado</th>
                <th className="p-3 text-right">Preço Loja Atual</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Preço Final (editável)</th>
                <th className="p-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {estoqueFiltrado.map((item) => {
                const { status, produtoLoja } = getStatus(item);
                const statusInfo = getStatusLabel(status);
                const precoCalculado = calcularPrecoPromocionalAPartirDoCusto(item.custo_medio);
                const precoEditadoStr = precosEditados[item.jogo_id] ?? precoCalculado.toFixed(2).replace(".", ",");
                const precoFinal = parseFloat(precoEditadoStr.replace(",", ".")) || precoCalculado;
                const parcela = calcularParcela(precoFinal, 5);
                const msg = mensagens[item.jogo_id];
                const isImportando = importando.has(item.jogo_id);
                const matchPorSimilaridade = produtoLoja && normalizarNome(produtoLoja.nome) !== normalizarNome(item.game_name);
                const jaImportado = jaImportadoIds.has(item.jogo_id);

                return (
                  <tr
                    key={item.jogo_id}
                    className={`bg-zinc-800/30 hover:bg-zinc-800/60 ${jaImportado ? "border-l-2 border-l-emerald-500/50" : ""}`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selecionados.has(item.jogo_id)}
                        onChange={() => toggleSelecionado(item.jogo_id)}
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
                      />
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
                            {item.game_name}
                          </button>
                        ) : (
                          <span className="font-medium text-white">{item.game_name}</span>
                        )}
                      </div>
                      {jaImportado && (
                        <div className="mt-1 inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">
                          Já importado
                        </div>
                      )}
                      {matchPorSimilaridade && (
                        <div className="mt-1 text-xs text-cyan-400">
                          ↳ Corresponde a: &quot;{produtoLoja.nome}&quot;
                        </div>
                      )}
                      {msg && (
                        <div
                          className={`mt-1 text-xs ${
                            msg.tipo === "erro"
                              ? "text-red-400"
                              : msg.tipo === "criado"
                              ? "text-yellow-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {msg.texto}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {item.qtd_ps4 > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                          {item.qtd_ps4}
                        </span>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {item.qtd_ps5 > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-xs font-medium text-white">
                          {item.qtd_ps5}
                        </span>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-medium text-white">{item.qtd_total}</td>
                    <td className="p-3 text-right text-zinc-400">
                      {item.qtd_ps4 > 0 ? formatBRL(item.custo_medio_ps4 ?? item.custo_medio) : "—"}
                    </td>
                    <td className="p-3 text-right text-zinc-400">
                      {item.qtd_ps5 > 0 ? formatBRL(item.custo_medio_ps5 ?? item.custo_medio) : "—"}
                    </td>
                    <td className="p-3 text-right font-medium text-emerald-400">
                      {formatBRL(precoCalculado)}
                    </td>
                    <td className="p-3 text-right">
                      {produtoLoja ? (
                        <span className={produtoLoja.ativo ? "text-white" : "text-zinc-500"}>
                          {formatBRL(produtoLoja.preco)}
                          {!produtoLoja.ativo && (
                            <span className="ml-1 text-xs text-zinc-500">(inativo)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${statusInfo.cor}`}
                      >
                        {statusInfo.texto}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <input
                          type="text"
                          value={precoEditadoStr}
                          onChange={(e) => handlePrecoChange(item.jogo_id, e.target.value)}
                          className="w-24 rounded border border-zinc-600 bg-zinc-700 px-2 py-1 text-right text-sm text-white focus:border-emerald-500 focus:outline-none"
                        />
                        <span className="text-xs text-zinc-500">12x {formatBRL(parcela)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {status === "novo" ? (
                        <button
                          type="button"
                          onClick={() => setCriarItem(item)}
                          className="rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-500"
                          title="Abrir janela para criar produto na loja"
                        >
                          Criar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleImportar(item)}
                          disabled={isImportando}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition ${
                            status === "meu_melhor" || status === "atualizar"
                              ? "bg-emerald-600 hover:bg-emerald-500"
                              : "bg-zinc-600 hover:bg-zinc-500"
                          } disabled:opacity-50`}
                        >
                          {isImportando ? "..." : status === "igual" ? "Atualizar" : "Importar"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {registroImportacoes.length > 0 && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium text-white">Registro de importações</h3>
            <button
              type="button"
              onClick={limparRegistro}
              className="rounded bg-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-500"
            >
              Limpar registro
            </button>
          </div>
          <ul className="max-h-48 space-y-1.5 overflow-y-auto text-sm">
            {registroImportacoes.map((r, i) => (
              <li key={`${r.jogo_id}-${r.dataHora}-${i}`} className="flex items-center justify-between gap-2 border-b border-zinc-700/50 pb-1.5 last:border-0">
                <span className="min-w-0 flex-1 truncate text-white" title={r.game_name}>
                  {r.game_name}
                </span>
                <span className="shrink-0 rounded px-2 py-0.5 text-xs font-medium text-zinc-400">
                  {r.tipo === "criado" ? "Criado" : r.tipo === "atualizado" ? "Atualizado" : r.tipo}
                </span>
                <span className="shrink-0 text-xs text-zinc-500">
                  {new Date(r.dataHora).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {estoque.length > 0 && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-4 text-sm text-zinc-400">
          <h3 className="mb-2 font-medium text-white">Legenda:</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-yellow-500"></span>
              <span>Novo Produto (não existe na loja)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-emerald-500"></span>
              <span>Seu preço é melhor que o da loja</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-500"></span>
              <span>Atualizar preço da loja</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-zinc-500"></span>
              <span>Preços iguais</span>
            </div>
          </div>
          <div className="mt-3 border-t border-zinc-700 pt-3">
            <h4 className="mb-1 font-medium text-white">Ao importar:</h4>
            <ul className="list-inside list-disc space-y-1">
              <li>Gerenciamento de estoque ativado automaticamente</li>
              <li>Quantidade de unidades definida automaticamente</li>
              <li>PS4/PS5 habilitados apenas se houver estoque</li>
              <li>Categoria &quot;Ofertas&quot; adicionada automaticamente</li>
            </ul>
          </div>
        </div>
      )}

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
                Criar produto — {criarItem.game_name}
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
                  const custoPs4 = criarItem.custo_medio_ps4 ?? criarItem.custo_medio;
                  const custoPs5 = criarItem.custo_medio_ps5 ?? criarItem.custo_medio;
                  const temPs4 = criarItem.qtd_ps4 > 0;
                  const temPs5 = criarItem.qtd_ps5 > 0;
                  const custoUnico = Math.abs(custoPs4 - custoPs5) < 0.02 || (!temPs4 || !temPs5);
                  const precoBaseSugerido = temPs4 && temPs5
                    ? calcularPrecoPromocionalAPartirDoCusto(Math.min(custoPs4, custoPs5))
                    : calcularPrecoPromocionalAPartirDoCusto(temPs4 ? custoPs4 : custoPs5);
                  const precoEditado = precosEditados[criarItem.jogo_id]
                    ? parseFloat(precosEditados[criarItem.jogo_id].replace(",", "."))
                    : null;
                  const precoVenda = Number.isNaN(precoEditado as number) || precoEditado == null
                    ? precoBaseSugerido
                    : precoEditado;

                  const params: Record<string, string> = {
                    nome: criarItem.game_name,
                    preco_custo: String(temPs4 && temPs5 ? Math.min(custoPs4, custoPs5) : (temPs4 ? custoPs4 : custoPs5)),
                    preco: String(precoVenda),
                    quantidade_estoque: String(criarItem.qtd_total),
                    quantidade_estoque_ps4: String(criarItem.qtd_ps4),
                    quantidade_estoque_ps5: String(criarItem.qtd_ps5),
                    gerenciar_estoque: "true",
                    disponivel_ps4: String(temPs4),
                    disponivel_ps5: String(temPs5),
                    embed: "1",
                  };
                  if (custoUnico) {
                    params.preco_promocional = String(calcularPrecoPromocionalAPartirDoCusto(temPs4 && temPs5 ? Math.min(custoPs4, custoPs5) : (temPs4 ? custoPs4 : custoPs5)));
                  } else {
                    params.usar_preco_promocional_por_console = "true";
                    if (temPs4) {
                      params.preco_custo_ps4 = String(custoPs4);
                      params.preco_promocional_ps4 = String(calcularPrecoPromocionalAPartirDoCusto(custoPs4));
                    }
                    if (temPs5) {
                      params.preco_custo_ps5 = String(custoPs5);
                      params.preco_promocional_ps5 = String(calcularPrecoPromocionalAPartirDoCusto(custoPs5));
                    }
                  }
                  return `/admin/produtos/novo?${new URLSearchParams(params).toString()}`;
                })()}
                title="Criar produto"
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
