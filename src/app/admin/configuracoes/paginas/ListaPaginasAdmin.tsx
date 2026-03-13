"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Pagina } from "@/lib/paginas";
import { excluirPaginaAction, toggleAtivoAction } from "./actions";

type Props = {
  paginas: Pagina[];
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export function ListaPaginasAdmin({ paginas }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function handleExcluir(id: string, titulo: string) {
    if (!confirm(`Excluir a página "${titulo}"?`)) return;
    setLoading(id);
    setMensagem(null);
    const res = await excluirPaginaAction(id);
    setLoading(null);
    if (res.ok) {
      router.refresh();
      setMensagem({ tipo: "ok", texto: "Página excluída." });
    } else {
      setMensagem({ tipo: "erro", texto: res.erro });
    }
  }

  async function handleToggleAtivo(id: string, ativo: boolean) {
    setLoading(id);
    setMensagem(null);
    const res = await toggleAtivoAction(id, !ativo);
    setLoading(null);
    if (res.ok) {
      router.refresh();
    } else {
      setMensagem({ tipo: "erro", texto: res.erro });
    }
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

      {paginas.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-12 text-center">
          <p className="text-zinc-400">Nenhuma página cadastrada.</p>
          <Link
            href="/admin/configuracoes/paginas/nova"
            className="mt-4 inline-block text-emerald-400 hover:underline"
          >
            Criar primeira página
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="px-4 py-3 font-medium text-zinc-400">Ordem</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Título</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Slug</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Criado em</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginas.map((p) => (
                <tr key={p.id} className="border-b border-zinc-800/80 last:border-0 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 text-zinc-300">{p.ordem}</td>
                  <td className="px-4 py-3 font-medium text-white">{p.titulo}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/pagina/${p.slug}`}
                      target="_blank"
                      className="text-emerald-400 hover:underline"
                    >
                      /pagina/{p.slug}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleAtivo(p.id, p.ativo)}
                      disabled={loading === p.id}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        p.ativo
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-zinc-600/20 text-zinc-400"
                      } hover:opacity-80 disabled:opacity-50`}
                    >
                      {p.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{formatarData(p.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/configuracoes/paginas/${p.id}/editar`}
                        className="rounded px-2 py-1 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleExcluir(p.id, p.titulo)}
                        disabled={loading === p.id}
                        className="rounded px-2 py-1 text-red-400 hover:bg-red-950/30 disabled:opacity-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
