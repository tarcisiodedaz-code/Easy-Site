"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  moverParaLixeira,
  encerrarPromocoesSelecionadas,
  limparTodasOfertas,
  toggleVitrineProduto,
  toggleDestaqueProduto,
  type ProdutoAdminRow,
} from "./actions";

type Props = { produtos: ProdutoAdminRow[] };

function formatarPreco(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function ListaProdutosAdmin({ produtos: initialProdutos }: Props) {
  const [produtos, setProdutos] = useState(initialProdutos);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [vitrineLoadingId, setVitrineLoadingId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  // Estados dos filtros
  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativo" | "inativo">("todos");
  const [filtroPromo, setFiltroPromo] = useState<"todos" | "com" | "sem">("todos");
  const [filtroEstoque, setFiltroEstoque] = useState<"todos" | "disponivel" | "indisponivel">("todos");
  const [filtroPendente, setFiltroPendente] = useState<"todos" | "sim" | "nao">("todos");

  // Extrair categorias únicas dos produtos
  const categoriasDisponiveis = useMemo(() => {
    const cats = new Set<string>();
    produtos.forEach((p) => {
      if (p.categoria_nome) cats.add(p.categoria_nome);
    });
    return Array.from(cats).sort();
  }, [produtos]);

  // Aplicar filtros
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      // Filtro de busca por nome
      if (filtroBusca.trim()) {
        const busca = filtroBusca.toLowerCase().trim();
        if (!p.nome.toLowerCase().includes(busca)) return false;
      }

      // Filtro por categoria
      if (filtroCategoria !== "todos") {
        if (p.categoria_nome !== filtroCategoria) return false;
      }

      // Filtro por status
      if (filtroStatus !== "todos") {
        const ativo = p.ativo !== false;
        if (filtroStatus === "ativo" && !ativo) return false;
        if (filtroStatus === "inativo" && ativo) return false;
      }

      // Filtro por promoção
      if (filtroPromo !== "todos") {
        const temPromo = p.preco_promocional != null && Number(p.preco_promocional) > 0;
        if (filtroPromo === "com" && !temPromo) return false;
        if (filtroPromo === "sem" && temPromo) return false;
      }

      // Filtro por estoque
      if (filtroEstoque !== "todos") {
        const gerenciaEstoque = p.gerenciar_estoque === true;
        const qtd = Number(p.quantidade_estoque ?? 0);
        const indisponivel = gerenciaEstoque && qtd <= 0;
        if (filtroEstoque === "disponivel" && indisponivel) return false;
        if (filtroEstoque === "indisponivel" && !indisponivel) return false;
      }

      // Filtro por pendente de info
      if (filtroPendente !== "todos") {
        const pendente = p.pendente_info === true;
        if (filtroPendente === "sim" && !pendente) return false;
        if (filtroPendente === "nao" && pendente) return false;
      }

      return true;
    });
  }, [produtos, filtroBusca, filtroCategoria, filtroStatus, filtroPromo, filtroEstoque, filtroPendente]);

  const todosComPromo = produtos.filter(
    (p) => p.preco_promocional != null && Number(p.preco_promocional) > 0
  );
  const algumSelecionado = selectedIds.size > 0;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === produtos.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(produtos.map((p) => p.id!).filter(Boolean)));
  }

  function clearPromoInState(ids: Set<string>) {
    setProdutos((prev) =>
      prev.map((p) => {
        if (!p.id || !ids.has(p.id)) return p;
        return {
          ...p,
          preco_promocional: null,
          oferta_inicio: null,
          oferta_fim: null,
        };
      })
    );
    setSelectedIds(new Set());
  }

  async function handleEncerrarSelecionadas() {
    if (!algumSelecionado) return;
    setBulkLoading(true);
    setMensagem(null);
    const ids = Array.from(selectedIds);
    const res = await encerrarPromocoesSelecionadas(ids);
    setBulkLoading(false);
    if (res.ok) {
      clearPromoInState(selectedIds);
      setMensagem({ tipo: "ok", texto: `Promoções encerradas em ${res.count ?? ids.length} produto(s).` });
    } else {
      setMensagem({ tipo: "erro", texto: res.erro ?? "Erro ao encerrar promoções." });
    }
  }

  async function handleLimparTodasOfertas() {
    if (
      !confirm(
        "Limpar TODAS as ofertas da loja? O preço promocional e o período de oferta serão removidos de todos os produtos. O preço de custo histórico é mantido. Confirma?"
      )
    )
      return;
    setBulkLoading(true);
    setMensagem(null);
    const res = await limparTodasOfertas();
    setBulkLoading(false);
    if (res.ok) {
      clearPromoInState(new Set(produtos.map((p) => p.id!).filter(Boolean)));
      setMensagem({ tipo: "ok", texto: `Todas as ofertas foram limpas (${res.count ?? 0} produtos).` });
    } else {
      setMensagem({ tipo: "erro", texto: res.erro ?? "Erro ao limpar ofertas." });
    }
  }

  async function handleToggleVitrine(id: string, campo: "is_lancamento" | "is_mais_vendido", valorAtual: boolean) {
    setVitrineLoadingId(id);
    const res = await toggleVitrineProduto(id, campo, !valorAtual);
    setVitrineLoadingId(null);
    if (res.ok) {
      setProdutos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [campo]: !valorAtual } : p))
      );
    } else {
      setMensagem({ tipo: "erro", texto: res.erro ?? "Erro ao atualizar." });
    }
  }

  async function handleToggleDestaque(id: string, valorAtual: boolean) {
    setVitrineLoadingId(id);
    const res = await toggleDestaqueProduto(id, !valorAtual);
    setVitrineLoadingId(null);
    if (res.ok) {
      setProdutos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, em_destaque: !valorAtual } : p))
      );
    } else {
      setMensagem({ tipo: "erro", texto: res.erro ?? "Erro ao atualizar." });
    }
  }

  async function handleMoverParaLixeira(id: string, nome: string) {
    if (!confirm(`Mover "${nome}" para a lixeira? Você pode restaurar depois.`)) return;
    setLoadingId(id);
    setMensagem(null);
    const res = await moverParaLixeira(id);
    setLoadingId(null);
    if (res.ok) {
      setProdutos((prev) => prev.filter((p) => p.id !== id));
      setMensagem({ tipo: "ok", texto: "Produto movido para a lixeira." });
    } else {
      setMensagem({ tipo: "erro", texto: res.erro ?? "Erro ao mover." });
    }
  }

  if (produtos.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
        <p className="text-zinc-400">Nenhum produto na loja ainda.</p>
        <Link
          href="/admin/produtos/novo"
          className="mt-4 inline-block text-[var(--accent)] hover:underline"
        >
          Criar Produto →
        </Link>
        <span className="mx-2 text-zinc-600">ou</span>
        <Link
          href="/admin/importar"
          className="inline-block text-[var(--accent)] hover:underline"
        >
          Importar ofertas →
        </Link>
      </div>
    );
  }

  return (
    <>
      {mensagem && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 ${
            mensagem.tipo === "ok"
              ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-200"
              : "border-red-900/50 bg-red-950/30 text-red-200"
          }`}
        >
          {mensagem.texto}
        </div>
      )}
      {/* Seção de Filtros */}
      <div className="mb-6 rounded-xl border border-[var(--border)] bg-zinc-900/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-300">Filtros</h3>
          {(filtroBusca || filtroCategoria !== "todos" || filtroStatus !== "todos" || filtroPromo !== "todos" || filtroEstoque !== "todos" || filtroPendente !== "todos") && (
            <button
              type="button"
              onClick={() => {
                setFiltroBusca("");
                setFiltroCategoria("todos");
                setFiltroStatus("todos");
                setFiltroPromo("todos");
                setFiltroEstoque("todos");
                setFiltroPendente("todos");
              }}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Limpar filtros
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {/* Busca por nome */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Buscar por nome</label>
            <input
              type="text"
              value={filtroBusca}
              onChange={(e) => setFiltroBusca(e.target.value)}
              placeholder="Digite o nome..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          {/* Filtro por categoria */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Categoria</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="todos">Todas</option>
              {categoriasDisponiveis.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Filtro por status */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as "todos" | "ativo" | "inativo")}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          {/* Filtro por promoção */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Promoção</label>
            <select
              value={filtroPromo}
              onChange={(e) => setFiltroPromo(e.target.value as "todos" | "com" | "sem")}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="todos">Todos</option>
              <option value="com">Com promoção</option>
              <option value="sem">Sem promoção</option>
            </select>
          </div>

          {/* Filtro por estoque */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Estoque</label>
            <select
              value={filtroEstoque}
              onChange={(e) => setFiltroEstoque(e.target.value as "todos" | "disponivel" | "indisponivel")}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="todos">Todos</option>
              <option value="disponivel">Disponível</option>
              <option value="indisponivel">Indisponível</option>
            </select>
          </div>

          {/* Filtro por pendente de info */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Pendente de Info</label>
            <select
              value={filtroPendente}
              onChange={(e) => setFiltroPendente(e.target.value as "todos" | "sim" | "nao")}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="todos">Todos</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </div>
        </div>
        {produtosFiltrados.length !== produtos.length && (
          <p className="mt-3 text-xs text-zinc-400">
            Mostrando {produtosFiltrados.length} de {produtos.length} produto(s)
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleEncerrarSelecionadas}
          disabled={!algumSelecionado || bulkLoading}
          className="rounded-lg border border-amber-700/50 bg-amber-950/30 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-950/50 disabled:opacity-50"
        >
          {bulkLoading ? "Processando…" : `Encerrar Promoções Selecionadas${algumSelecionado ? ` (${selectedIds.size})` : ""}`}
        </button>
        <button
          type="button"
          onClick={handleLimparTodasOfertas}
          disabled={bulkLoading || todosComPromo.length === 0}
          className="rounded-lg border border-red-800/50 bg-red-950/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-950/40 disabled:opacity-50"
        >
          Limpar Todas as Ofertas da Loja
        </button>
        {todosComPromo.length > 0 && (
          <span className="text-sm text-zinc-500">
            {todosComPromo.length} produto(s) com oferta ativa
          </span>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-zinc-900/50">
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    checked={produtosFiltrados.length > 0 && selectedIds.size === produtosFiltrados.length}
                    onChange={() => {
                      if (selectedIds.size === produtosFiltrados.length) {
                        setSelectedIds(new Set());
                      } else {
                        setSelectedIds(new Set(produtosFiltrados.map((p) => p.id!).filter(Boolean)));
                      }
                    }}
                    className="rounded border-zinc-600 bg-zinc-800 text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                </th>
                <th className="p-3 font-medium text-zinc-300">Capa</th>
                <th className="p-3 font-medium text-zinc-300">Nome</th>
                <th className="p-3 font-medium text-zinc-300">Categoria / Subcategoria</th>
                <th className="p-3 font-medium text-zinc-300">Preço (Venda / Promo)</th>
                <th className="p-3 font-medium text-zinc-300">Estoque</th>
                <th className="p-3 font-medium text-zinc-300 text-center">Destaque</th>
                <th className="p-3 font-medium text-zinc-300">Status</th>
                <th className="p-3 font-medium text-zinc-300 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-500">
                    Nenhum produto encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : produtosFiltrados.map((p) => {
                const id = p.id!;
                const img =
                  p.imagem_url ||
                  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100";
                const precoVenda = Number(p.preco);
                const precoPromo =
                  p.preco_promocional != null && Number(p.preco_promocional) > 0
                    ? Number(p.preco_promocional)
                    : null;
                const gerenciarEstoque = p.gerenciar_estoque === true;
                const qtd = Number(p.quantidade_estoque ?? 0);
                const indisponivel = gerenciarEstoque && qtd <= 0;
                const catLabel = [p.categoria_nome, p.subcategoria_nome].filter(Boolean).join(" / ") || "—";
                return (
                  <tr
                    key={id}
                    className="border-b border-[var(--border)]/80 transition-colors hover:bg-zinc-800/30"
                  >
                    <td className="w-10 p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(id)}
                        onChange={() => toggleSelect(id)}
                        className="rounded border-zinc-600 bg-zinc-800 text-[var(--accent)] focus:ring-[var(--accent)]"
                      />
                    </td>
                    <td className="p-3">
                      <div className="relative h-14 w-11 overflow-hidden rounded-lg bg-zinc-800" style={{ aspectRatio: "3/4" }}>
                        <Image
                          src={img}
                          alt={p.nome}
                          fill
                          className="object-cover"
                          sizes="44px"
                          unoptimized
                        />
                      </div>
                    </td>
                    <td className="p-3 font-medium text-white">
                      <span className="block">{p.nome}</span>
                      {p.pendente_info && (
                        <span className="mt-1 inline-block rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                          Pendente de Info
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-zinc-400">{catLabel}</td>
                    <td className="p-3">
                      {precoPromo != null ? (
                        <span>
                          <span className="text-emerald-400">{formatarPreco(precoPromo)}</span>
                          <span className="ml-1 text-xs text-zinc-500 line-through">
                            {formatarPreco(precoVenda)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-zinc-300">{formatarPreco(precoVenda)}</span>
                      )}
                    </td>
                    <td className="p-3 text-zinc-400">
                      {gerenciarEstoque ? (
                        indisponivel ? (
                          <span className="text-amber-400">Indisponível</span>
                        ) : (
                          qtd
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleDestaque(id, !!p.em_destaque)}
                        disabled={vitrineLoadingId === id}
                        title={p.em_destaque ? "Desmarcar Destaque" : "Marcar como Destaque"}
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          p.em_destaque
                            ? "bg-amber-500/30 text-amber-400"
                            : "bg-zinc-700/50 text-zinc-500"
                        } disabled:opacity-50`}
                      >
                        {vitrineLoadingId === id ? "…" : p.em_destaque ? "Sim" : "Não"}
                      </button>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          p.ativo !== false
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-zinc-600/50 text-zinc-400"
                        }`}
                      >
                        {p.ativo !== false ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/produtos/${id}/editar`}
                          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleMoverParaLixeira(id, p.nome)}
                          disabled={!!loadingId}
                          className="rounded-lg border border-amber-700/50 px-3 py-1.5 text-sm text-amber-400 hover:bg-amber-950/30 disabled:opacity-50"
                        >
                          {loadingId === id ? "…" : "Mover para Lixeira"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
