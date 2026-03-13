import Link from "next/link";
import { getTodasPaginas } from "@/lib/paginas";
import { ListaPaginasAdmin } from "./ListaPaginasAdmin";

export default async function AdminPaginasPage() {
  const paginas = await getTodasPaginas();

  return (
    <div className="min-h-screen bg-[#0f1115] text-zinc-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Configurações → Páginas
            </h1>
            <p className="mt-2 text-zinc-400">
              Gerencie as páginas institucionais do site.
            </p>
          </div>
          <Link
            href="/admin/configuracoes/paginas/nova"
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            + Nova Página
          </Link>
        </header>

        <ListaPaginasAdmin paginas={paginas} />
      </div>
    </div>
  );
}
