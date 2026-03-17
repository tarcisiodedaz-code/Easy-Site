import Link from "next/link";
import { getCategoriasProduto } from "@/lib/produtos-completo";
import { FormNovoProduto } from "./FormNovoProduto";

export default async function NovoProdutoPage() {
  const categorias = await getCategoriasProduto();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/admin/produtos" className="mb-8 inline-block text-sm text-zinc-400 hover:text-white">
        ← Listar Produtos
      </Link>
      <h1 className="text-2xl font-bold text-white">Cadastrar produto</h1>
      <p className="mt-1 text-zinc-400">
        Preencha as informações e clique em Cadastrar para salvar na loja.
      </p>
      <FormNovoProduto categorias={categorias} />
    </div>
  );
}
