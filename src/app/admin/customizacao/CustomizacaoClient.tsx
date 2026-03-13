"use client";

import { useState } from "react";
import Link from "next/link";
import { EditorBanners } from "./EditorBanners";
import type { CategoriaComItens } from "@/lib/categorias";
import type { CarouselSlide, PreSaleConfig } from "@/types/loja-config";

type Props = {
  categorias: CategoriaComItens[];
  carousel: CarouselSlide[];
  preSale: PreSaleConfig;
};

export function CustomizacaoClient({ categorias, carousel, preSale }: Props) {
  const [tab, setTab] = useState<"categorias" | "banners">("categorias");

  return (
    <div className="space-y-8">
      <div className="flex gap-2 border-b border-zinc-800">
        <button
          type="button"
          onClick={() => setTab("categorias")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "categorias"
              ? "border-emerald-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Categorias
        </button>
        <button
          type="button"
          onClick={() => setTab("banners")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "banners"
              ? "border-emerald-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Banners
        </button>
      </div>

      {tab === "categorias" && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-white">Gerenciamento de categorias</h2>
          <p className="mb-4 text-sm text-zinc-400">
            Crie, edite e exclua categorias e subcategorias do menu. Use ícone preset ou faça upload de um ícone
            customizado (SVG/PNG).
          </p>
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
            Dimensão recomendada: 64x64px para ícones de menu.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/categorias/nova"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              + Nova categoria
            </Link>
            <Link
              href="/admin/categorias"
              className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
            >
              Ver todas e editar
            </Link>
          </div>
          {categorias.length > 0 && (
            <ul className="mt-6 space-y-2">
              {categorias.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-800/50 px-3 py-2">
                  <span className="text-sm text-white">{c.nome}</span>
                  <Link
                    href={`/admin/categorias/${c.id}/editar`}
                    className="text-sm text-emerald-400 hover:underline"
                  >
                    Editar
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "banners" && <EditorBanners carousel={carousel} preSale={preSale} />}
    </div>
  );
}
