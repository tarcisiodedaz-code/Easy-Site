import Link from "next/link";
import { getCategoriasProdutoAdmin } from "./actions";
import { ListaCategoriasProdutoAdmin } from "./ListaCategoriasProdutoAdmin";

export default async function CategoriasProdutoPage() {
  const categorias = await getCategoriasProdutoAdmin();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-10">
        <Link href="/admin/produtos" className="mb-4 inline-block text-sm text-zinc-400 hover:text-white">
          ← Listar Produtos
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white">Categorias de produto</h1>
        <p className="mt-2 text-zinc-400">
          Crie categorias e subcategorias (Categoria Pai) para organizar os produtos. Use ícone e slug para o site.
        </p>
      </header>

      <ListaCategoriasProdutoAdmin categorias={categorias} />
    </div>
  );
}
