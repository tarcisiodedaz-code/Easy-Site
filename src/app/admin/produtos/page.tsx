import Link from "next/link";
import { getProdutosParaAdmin } from "./actions";
import { ListaProdutosAdmin } from "./ListaProdutosAdmin";

export default async function AdminProdutosPage() {
  const produtos = await getProdutosParaAdmin();

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">Listar Produtos</h1>
        <p className="mt-2 text-zinc-400">
          Gerencie capas, preços, estoque e status. Use &quot;Criar Produto&quot; ou &quot;Importar ofertas&quot; para adicionar itens.
        </p>
      </header>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {produtos.length} {produtos.length === 1 ? "produto" : "produtos"} na loja
        </p>
        <div className="flex gap-2">
          <Link
            href="/admin/produtos/novo"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            + Criar Produto
          </Link>
          <Link
            href="/admin/importar"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            Importar ofertas
          </Link>
        </div>
      </div>

      <ListaProdutosAdmin produtos={produtos} />
    </div>
  );
}
