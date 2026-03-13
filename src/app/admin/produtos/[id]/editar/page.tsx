import Link from "next/link";
import { notFound } from "next/navigation";
import { getProdutoPorId } from "@/lib/produtos";
import { getCategoriasProduto } from "@/lib/produtos-completo";
import { getCategoriaIdsDoProduto } from "../../actions";
import { FormEditarProduto } from "./FormEditarProduto";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [produto, categorias, categoriaIds] = await Promise.all([
    getProdutoPorId(id),
    getCategoriasProduto(),
    getCategoriaIdsDoProduto(id),
  ]);

  if (!produto || !produto.id) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/admin/produtos"
          className="text-sm text-zinc-400 hover:text-white"
        >
          ← Listar Produtos
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-white">Editar produto</h1>
      <p className="mt-1 text-zinc-400">{produto.nome}</p>
      <FormEditarProduto produto={produto} categorias={categorias} categoriaIdsIniciais={categoriaIds} />
    </div>
  );
}
