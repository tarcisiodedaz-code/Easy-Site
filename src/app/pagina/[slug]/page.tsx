import { notFound } from "next/navigation";
import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";
import { getPaginaPorSlug } from "@/lib/paginas";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const pagina = await getPaginaPorSlug(slug);

  if (!pagina) {
    return { title: "Página não encontrada" };
  }

  return {
    title: `${pagina.titulo} | Easy Games`,
    description: pagina.conteudo?.slice(0, 160) || pagina.titulo,
  };
}

export default async function PaginaInstitucional({ params }: Props) {
  const { slug } = await params;
  const pagina = await getPaginaPorSlug(slug);

  if (!pagina) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <StoreHeader />

      <main className="pt-[130px] pb-16 sm:pt-[140px] md:pt-[150px]">
        <article className="mx-auto max-w-4xl px-4">
          <header className="mb-8 border-b border-[var(--border)] pb-6">
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              {pagina.titulo}
            </h1>
          </header>

          <div className="prose prose-invert max-w-none">
            {pagina.conteudo?.split("\n\n").map((paragrafo, i) => (
              <p key={i} className="mb-4 text-zinc-300 leading-relaxed">
                {paragrafo.split("\n").map((linha, j) => (
                  <span key={j}>
                    {linha}
                    {j < paragrafo.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </p>
            ))}
          </div>
        </article>
      </main>

      <StoreFooter />
    </div>
  );
}
