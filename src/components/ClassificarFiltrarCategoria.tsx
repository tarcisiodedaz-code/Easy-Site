"use client";

import { useState, useMemo } from "react";
import { ProdutoCardV2 } from "./ProdutoCard";
import type { ProdutoLoja } from "@/lib/supabase";

const SORT_OPTIONS = [
  { value: "mais_vendidos", label: "Mais vendidos" },
  { value: "nome_az", label: "Nome (A-Z)" },
  { value: "nome_za", label: "Nome (Z-A)" },
  { value: "mais_novos", label: "Mais novos" },
  { value: "mais_antigos", label: "Mais antigos" },
] as const;

const PRICE_RANGES = [
  { id: "ate50", label: "Até R$ 50", min: 0, max: 50 },
  { id: "50-150", label: "R$ 50 - R$ 150", min: 50, max: 150 },
  { id: "150-300", label: "R$ 150 - R$ 300", min: 150, max: 300 },
  { id: "acima300", label: "Acima de R$ 300", min: 300, max: Infinity },
];

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

type Subcategoria = { id: string; nome: string };

type Props = {
  produtos: ProdutoLoja[];
  subcategorias: Subcategoria[];
  categoriaIdsByProduto: Record<string, string[]>;
};

function getPrecoExibir(p: ProdutoLoja): number {
  const promo = p.preco_promocional;
  if (promo != null && Number(promo) > 0) {
    const now = Date.now();
    const inicio = p.oferta_inicio ? new Date(p.oferta_inicio).getTime() : null;
    const fim = p.oferta_fim ? new Date(p.oferta_fim).getTime() : null;
    if ((inicio == null || now >= inicio) && (fim == null || now <= fim))
      return Number(promo);
  }
  return Number(p.preco);
}

export function ClassificarFiltrarCategoria({
  produtos,
  subcategorias,
  categoriaIdsByProduto,
}: Props) {
  const [sort, setSort] = useState<SortValue>("mais_novos");
  const [priceRangeId, setPriceRangeId] = useState<string | null>(null);
  const [generoIds, setGeneroIds] = useState<string[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const filteredAndSorted = useMemo(() => {
    let list = [...produtos];

    // Filtro por faixa de preço
    if (priceRangeId) {
      const range = PRICE_RANGES.find((r) => r.id === priceRangeId);
      if (range) {
        list = list.filter((p) => {
          const preco = getPrecoExibir(p);
          return preco >= range.min && preco < range.max;
        });
      }
    }

    // Filtro por gênero (subcategorias)
    if (generoIds.length > 0) {
      list = list.filter((p) => {
        const id = p.id ?? p.id_externo;
        const catIds = id ? categoriaIdsByProduto[id] ?? [] : [];
        return generoIds.some((gid) => catIds.includes(gid));
      });
    }

    // Ordenação
    if (sort === "nome_az") {
      list.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    } else if (sort === "nome_za") {
      list.sort((a, b) => b.nome.localeCompare(a.nome, "pt-BR"));
    } else if (sort === "mais_novos") {
      list.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });
    } else if (sort === "mais_antigos") {
      list.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return ta - tb;
      });
    } else if (sort === "mais_vendidos") {
      list.sort((a, b) => {
        const va = (a as ProdutoLoja & { is_mais_vendido?: boolean }).is_mais_vendido ? 1 : 0;
        const vb = (b as ProdutoLoja & { is_mais_vendido?: boolean }).is_mais_vendido ? 1 : 0;
        if (vb !== va) return vb - va;
        return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      });
    }

    return list;
  }, [produtos, sort, priceRangeId, generoIds, categoriaIdsByProduto]);

  const toggleGenero = (id: string) => {
    setGeneroIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setPriceRangeId(null);
    setGeneroIds([]);
  };

  const hasFilters = priceRangeId != null || generoIds.length > 0;

  return (
    <div className="space-y-4">
      {/* Barra: alinhada à direita, dentro do mesmo container da grid */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-700/80 hover:text-white"
          >
            <svg
              className="h-5 w-5 shrink-0 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            Classificar e filtrar
            {hasFilters && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">
                !
              </span>
            )}
          </button>

          {panelOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                aria-hidden
                onClick={() => setPanelOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-[320px] rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl sm:w-[360px]">
                <div className="max-h-[80vh] overflow-y-auto p-4">
                  <h3 className="mb-3 text-sm font-semibold text-white">
                    Ordenar por
                  </h3>
                  <ul className="space-y-1">
                    {SORT_OPTIONS.map((opt) => (
                      <li key={opt.value}>
                        <button
                          type="button"
                          onClick={() => {
                            setSort(opt.value);
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            sort === opt.value
                              ? "bg-cyan-500/20 text-cyan-300"
                              : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                          }`}
                        >
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>

                  <h3 className="mb-3 mt-6 text-sm font-semibold text-white">
                    Faixa de preço
                  </h3>
                  <ul className="space-y-1">
                    {PRICE_RANGES.map((r) => (
                      <li key={r.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                          <input
                            type="radio"
                            name="price"
                            checked={priceRangeId === r.id}
                            onChange={() =>
                              setPriceRangeId(priceRangeId === r.id ? null : r.id)
                            }
                            className="h-4 w-4 border-zinc-600 text-cyan-500 focus:ring-cyan-500"
                          />
                          {r.label}
                        </label>
                      </li>
                    ))}
                  </ul>

                  {subcategorias.length > 0 && (
                    <>
                      <h3 className="mb-3 mt-6 text-sm font-semibold text-white">
                        Gênero
                      </h3>
                      <ul className="space-y-1">
                        {subcategorias.map((s) => (
                          <li key={s.id}>
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                              <input
                                type="checkbox"
                                checked={generoIds.includes(s.id)}
                                onChange={() => toggleGenero(s.id)}
                                className="h-4 w-4 rounded border-zinc-600 text-cyan-500 focus:ring-cyan-500"
                              />
                              {s.nome}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {hasFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-4 w-full rounded-lg border border-zinc-600 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grid de produtos – mesma estrutura da página (5 colunas no lg) */}
      {filteredAndSorted.length === 0 ? (
        <p className="py-12 text-center text-zinc-400">
          Nenhum produto encontrado com os filtros selecionados.
        </p>
      ) : (
        <div className="grid grid-cols-2 min-w-0 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
          {filteredAndSorted.map((p) => (
            <div key={p.id ?? p.id_externo} className="min-w-0">
              <ProdutoCardV2 produto={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
