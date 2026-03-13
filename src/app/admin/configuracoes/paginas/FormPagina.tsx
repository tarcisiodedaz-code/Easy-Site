"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Pagina } from "@/lib/paginas";
import { gerarSlug } from "@/lib/paginas";
import { criarPaginaAction, atualizarPaginaAction } from "./actions";

type Props = {
  pagina?: Pagina;
};

export function FormPagina({ pagina }: Props) {
  const router = useRouter();
  const isEdicao = !!pagina;

  const [titulo, setTitulo] = useState(pagina?.titulo ?? "");
  const [slug, setSlug] = useState(pagina?.slug ?? "");
  const [conteudo, setConteudo] = useState(pagina?.conteudo ?? "");
  const [ativo, setAtivo] = useState(pagina?.ativo ?? true);
  const [ordem, setOrdem] = useState(pagina?.ordem ?? 0);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(isEdicao);

  useEffect(() => {
    if (!slugEditadoManualmente && titulo) {
      setSlug(gerarSlug(titulo));
    }
  }, [titulo, slugEditadoManualmente]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("slug", slug);
    formData.append("conteudo", conteudo);
    formData.append("ativo", String(ativo));
    formData.append("ordem", String(ordem));

    const res = isEdicao
      ? await atualizarPaginaAction(pagina.id, formData)
      : await criarPaginaAction(formData);

    setLoading(false);

    if (res.ok) {
      router.push("/admin/configuracoes/paginas");
      router.refresh();
    } else {
      setErro(res.erro);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {erro && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-200">
          {erro}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="titulo" className="mb-2 block text-sm font-medium text-zinc-300">
            Título *
          </label>
          <input
            type="text"
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            placeholder="Ex: Termos de Uso"
          />
        </div>

        <div>
          <label htmlFor="slug" className="mb-2 block text-sm font-medium text-zinc-300">
            Slug (URL) *
          </label>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">/pagina/</span>
            <input
              type="text"
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugEditadoManualmente(true);
              }}
              required
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              placeholder="termos-de-uso"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="conteudo" className="mb-2 block text-sm font-medium text-zinc-300">
          Conteúdo
        </label>
        <textarea
          id="conteudo"
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          rows={15}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          placeholder="Digite o conteúdo da página..."
        />
        <p className="mt-1 text-xs text-zinc-500">
          Dica: Use linhas em branco para separar parágrafos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="ordem" className="mb-2 block text-sm font-medium text-zinc-300">
            Ordem de exibição
          </label>
          <input
            type="number"
            id="ordem"
            value={ordem}
            onChange={(e) => setOrdem(parseInt(e.target.value) || 0)}
            min={0}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Páginas com ordem menor aparecem primeiro.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-8">
          <input
            type="checkbox"
            id="ativo"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="h-5 w-5 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
          />
          <label htmlFor="ativo" className="text-sm text-zinc-300">
            Página ativa (visível no site)
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4 border-t border-zinc-800 pt-6">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Salvando..." : isEdicao ? "Salvar Alterações" : "Criar Página"}
        </button>
        <Link
          href="/admin/configuracoes/paginas"
          className="rounded-lg border border-zinc-700 px-6 py-2.5 font-medium text-zinc-300 hover:bg-zinc-800"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
