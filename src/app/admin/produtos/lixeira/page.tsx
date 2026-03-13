import Link from "next/link";
import { getProdutosLixeira } from "../actions";
import { ListaLixeiraAdmin } from "./ListaLixeiraAdmin";

export default async function LixeiraPage() {
  const produtos = await getProdutosLixeira();

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-10">
        <Link href="/admin/produtos" className="mb-4 inline-block text-sm text-zinc-400 hover:text-white">
          ← Listar Produtos
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white">Lixeira</h1>
        <p className="mt-2 text-zinc-400">
          Produtos movidos para a lixeira. Restaure ou exclua permanentemente.
        </p>
      </header>

      <ListaLixeiraAdmin produtos={produtos} />
    </div>
  );
}
