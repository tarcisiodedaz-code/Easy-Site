import Link from "next/link";

export function CtaFinal() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <div className="rounded-2xl border-2 border-[var(--accent)]/30 bg-[var(--card)] p-8 text-center sm:p-12">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Pronto para garantir o seu jogo?
        </h2>
        <p className="mt-3 text-zinc-400">
          Escolha abaixo e finalize em poucos cliques. Pagamento seguro e entrega rápida.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/categorias/ofertas"
            className="rounded-lg bg-[var(--accent)] px-8 py-3.5 font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            Compre agora
          </Link>
          <Link
            href="/#pre-venda"
            className="rounded-lg border-2 border-[var(--accent)] bg-transparent px-8 py-3.5 font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
          >
            Garantir oferta
          </Link>
        </div>
      </div>
    </section>
  );
}
