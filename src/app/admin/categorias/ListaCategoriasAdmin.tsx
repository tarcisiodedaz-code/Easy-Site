"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { excluirCategoria } from "./actions";
import type { CategoriaComItens } from "@/lib/categorias";

type Props = { categorias: CategoriaComItens[] };

export function ListaCategoriasAdmin({ categorias: initial }: Props) {
  const router = useRouter();
  const [categorias, setCategorias] = useState(initial);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function handleExcluir(id: string, nome: string) {
    if (!confirm(`Excluir a categoria "${nome}"? Os itens do dropdown também serão removidos.`)) return;
    setExcluindoId(id);
    setMensagem(null);
    const res = await excluirCategoria(id);
    setExcluindoId(null);
    if (res.ok) {
      setCategorias((prev) => prev.filter((c) => c.id !== id));
      setMensagem({ tipo: "ok", texto: "Categoria excluída." });
    } else {
      setMensagem({ tipo: "erro", texto: res.erro ?? "Erro ao excluir." });
    }
  }

  if (categorias.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
        <p className="text-zinc-400">Nenhuma categoria cadastrada.</p>
        <Link href="/admin/categorias/nova" className="mt-4 inline-block text-[var(--accent)] hover:underline">
          Criar primeira categoria →
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
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border)] text-sm text-zinc-400">
              <th className="p-4 font-medium">Ordem</th>
              <th className="p-4 font-medium">Nome</th>
              <th className="p-4 font-medium">Link / Dropdown</th>
              <th className="p-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.id} className="border-b border-[var(--border)]/80 hover:bg-zinc-800/30">
                <td className="p-4 text-zinc-500">{c.ordem}</td>
                <td className="p-4 font-medium text-white">{c.nome}</td>
                <td className="p-4 text-zinc-400">
                  {c.href ? c.href : `${c.itens.length} itens no dropdown`}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/categorias/${c.id}/editar`}
                      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleExcluir(c.id, c.nome)}
                      disabled={!!excluindoId}
                      className="rounded-lg border border-red-900/50 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950/30 disabled:opacity-50"
                    >
                      {excluindoId === c.id ? "Excluindo…" : "Excluir"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
