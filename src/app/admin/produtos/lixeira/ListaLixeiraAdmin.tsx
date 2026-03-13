"use client";

import Image from "next/image";
import { useState } from "react";
import { restaurarProduto, excluirPermanentemente, type ProdutoAdminRow } from "../actions";

type Props = { produtos: ProdutoAdminRow[] };

export function ListaLixeiraAdmin({ produtos: initialProdutos }: Props) {
  const [produtos, setProdutos] = useState(initialProdutos);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function handleRestaurar(id: string) {
    setLoadingId(id);
    setMensagem(null);
    const res = await restaurarProduto(id);
    setLoadingId(null);
    if (res.ok) {
      setProdutos((prev) => prev.filter((p) => p.id !== id));
      setMensagem({ tipo: "ok", texto: "Produto restaurado." });
    } else {
      setMensagem({ tipo: "erro", texto: res.erro ?? "Erro ao restaurar." });
    }
  }

  async function handleExcluir(id: string, nome: string) {
    if (!confirm(`Excluir permanentemente "${nome}"? Esta ação não pode ser desfeita.`)) return;
    setLoadingId(id);
    setMensagem(null);
    const res = await excluirPermanentemente(id);
    setLoadingId(null);
    if (res.ok) {
      setProdutos((prev) => prev.filter((p) => p.id !== id));
      setMensagem({ tipo: "ok", texto: "Produto excluído permanentemente." });
    } else {
      setMensagem({ tipo: "erro", texto: res.erro ?? "Erro ao excluir." });
    }
  }

  if (produtos.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-zinc-400">
        Nenhum produto na lixeira.
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
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-zinc-900/50">
                <th className="p-3 font-medium text-zinc-300">Capa</th>
                <th className="p-3 font-medium text-zinc-300">Nome</th>
                <th className="p-3 font-medium text-zinc-300">Removido em</th>
                <th className="p-3 font-medium text-zinc-300 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => {
                const id = p.id!;
                const img =
                  p.imagem_url ||
                  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100";
                const removidoEm = p.deletado_em
                  ? new Date(p.deletado_em).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—";
                return (
                  <tr
                    key={id}
                    className="border-b border-[var(--border)]/80 hover:bg-zinc-800/30"
                  >
                    <td className="p-3">
                      <div
                        className="relative h-14 w-11 overflow-hidden rounded-lg bg-zinc-800"
                        style={{ aspectRatio: "3/4" }}
                      >
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
                    <td className="p-3 font-medium text-white">{p.nome}</td>
                    <td className="p-3 text-zinc-500">{removidoEm}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestaurar(id)}
                          disabled={!!loadingId}
                          className="rounded-lg border border-emerald-700/50 px-3 py-1.5 text-sm text-emerald-400 hover:bg-emerald-950/30 disabled:opacity-50"
                        >
                          {loadingId === id ? "…" : "Restaurar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluir(id, p.nome)}
                          disabled={!!loadingId}
                          className="rounded-lg border border-red-700/50 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950/30 disabled:opacity-50"
                        >
                          Excluir permanentemente
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
