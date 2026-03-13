import Link from "next/link";
import type { Pagina } from "@/lib/paginas";

type Props = {
  paginas: Pagina[];
};

export function PaginasInstitucionais({ paginas }: Props) {
  if (paginas.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Informações</h2>
        <ul className="space-y-2">
          {paginas.map((p) => (
            <li key={p.id}>
              <Link
                href={`/pagina/${p.slug}`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <svg
                  className="h-4 w-4 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {p.titulo}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
