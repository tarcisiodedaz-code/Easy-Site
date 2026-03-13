import { ProdutoCardV2 } from "./ProdutoCard";
import type { ProdutoLoja } from "@/lib/supabase";

type Props = { produtos: ProdutoLoja[] };

export function VitrineLancamentos({ produtos }: Props) {
  if (produtos.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-[2rem]">
        ✨ LANÇAMENTOS
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-4 lg:grid-cols-5 lg:gap-6">
        {produtos.map((p) => (
          <div key={p.id ?? p.id_externo} className="min-w-0">
            <ProdutoCardV2 produto={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
