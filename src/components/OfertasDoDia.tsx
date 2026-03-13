import { getProdutosLoja } from "@/lib/produtos";
import { ProdutoCard } from "./ProdutoCard";
import type { ProdutoLoja } from "@/lib/supabase";

type OfertasDoDiaProps = { produtos?: ProdutoLoja[] };

export async function OfertasDoDia({ produtos: produtosProp }: OfertasDoDiaProps = {}) {
  const produtos = produtosProp ?? (await getProdutosLoja());

  return (
    <section id="ofertas" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Lançamentos e ofertas do dia
          </h2>
          <p className="mt-1 text-zinc-400">
            Os melhores jogos com o melhor preço. Pague via Pix ou parcelado.
          </p>
        </div>
      </div>

      {produtos.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <p className="text-zinc-400">
            Nenhuma oferta no momento. Em breve novidades!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {produtos.map((produto) => (
            <ProdutoCard key={produto.id ?? produto.id_externo} produto={produto} />
          ))}
        </div>
      )}
    </section>
  );
}
