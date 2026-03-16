import { buscarProdutosLoja } from "./actions";
import EstoqueLojaClient from "./EstoqueLojaClient";

export const dynamic = "force-dynamic";

export default async function EstoqueLojaPage() {
  const produtosLoja = await buscarProdutosLoja();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Estoque → Loja</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Importe produtos do seu sistema de estoque (easy-games) para a loja.
        </p>
      </div>
      
      <EstoqueLojaClient produtosLoja={produtosLoja} />
    </div>
  );
}
