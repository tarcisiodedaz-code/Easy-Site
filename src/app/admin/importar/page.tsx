import { buscarProdutosLoja } from "../estoque-loja/actions";
import ImportarOfertasClient from "./ImportarOfertasClient";

export const dynamic = "force-dynamic";

export default async function AdminImportarPage() {
  const produtosLoja = await buscarProdutosLoja();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Importar — PlayStation Store
          </h1>
          <p className="mt-2 text-zinc-400">
            Busque ofertas em lote ou importe um jogo pela URL da página do produto (nome, preço com as mesmas regras de revenda e descrição estilo PS Store).
          </p>
        </header>
        <ImportarOfertasClient produtosLoja={produtosLoja} />
      </div>
    </div>
  );
}
