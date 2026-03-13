import Link from "next/link";
import { ProdutoCard } from "./ProdutoCard";
import type { ProdutoLoja } from "@/lib/supabase";

type DestaquesProps = { produtos: ProdutoLoja[] };

const MAX_DESTAQUES = 4;

export function Destaques({ produtos }: DestaquesProps) {
  const lista = produtos.slice(0, MAX_DESTAQUES);
  if (lista.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Os jogos que todo mundo está comprando
          </h2>
          <p className="mt-1 text-zinc-400">
            Ofertas selecionadas. Pré-vendas e lançamentos em um só lugar.
          </p>
        </div>
        <Link
          href="/categorias/ofertas"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Ver todas as ofertas →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {lista.map((produto) => (
          <ProdutoCard key={produto.id ?? produto.id_externo} produto={produto} />
        ))}
      </div>
    </section>
  );
}
