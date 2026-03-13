import Link from "next/link";
import { getCategorias } from "@/lib/categorias";
import { ListaCategoriasAdmin } from "./ListaCategoriasAdmin";

export default async function AdminCategoriasPage() {
  const categorias = await getCategorias();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Categorias do menu
        </h1>
        <p className="mt-2 text-zinc-400">
          Crie, edite ou exclua as categorias exibidas na barra de navegação da loja.
        </p>
      </header>

      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/categorias/nova"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          + Nova categoria
        </Link>
      </div>

      <ListaCategoriasAdmin categorias={categorias} />
    </div>
  );
}
