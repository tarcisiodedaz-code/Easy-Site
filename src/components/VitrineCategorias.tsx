import Link from "next/link";
import { getNavIcon } from "./NavIcons";
import type { CategoriaMenu } from "@/lib/produtos-completo";

function iconForSlug(slug: string | null, nome: string): string {
  const s = (slug ?? "").toLowerCase();
  const n = nome.toLowerCase();
  if (s.includes("ps5") || n.includes("ps5") || n.includes("playstation 5")) return "ps5";
  if (s.includes("ps4") || n.includes("ps4") || n.includes("playstation 4")) return "ps4";
  if (s.includes("gift") || n.includes("gift") || n.includes("cartão")) return "giftcard";
  return "pages";
}

type Props = { categorias: CategoriaMenu[] };

export function VitrineCategorias({ categorias }: Props) {
  const principais = categorias.slice(0, 6);

  if (principais.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-3 py-10 sm:px-6 sm:py-14">
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Navegue por categorias
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {principais.map((cat) => {
          const iconName = iconForSlug(cat.slug, cat.nome);
          return (
            <Link
              key={cat.id}
              href={cat.href}
              className="group flex items-center gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-6 transition-all hover:border-cyan-500/50 hover:bg-zinc-800/80 hover:shadow-[0_0_30px_rgba(6,182,212,0.12)]"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-cyan-400 transition-colors group-hover:bg-cyan-500/20 group-hover:text-cyan-300">
                {getNavIcon(iconName)}
              </div>
              <div>
                <p className="font-semibold text-white group-hover:text-cyan-100">
                  {cat.nome.toUpperCase()}
                </p>
                <p className="text-sm text-zinc-400">Ver jogos</p>
              </div>
              <svg
                className="ml-auto h-5 w-5 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
