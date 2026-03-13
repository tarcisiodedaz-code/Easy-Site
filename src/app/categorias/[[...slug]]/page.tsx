import Link from "next/link";
import { notFound } from "next/navigation";
import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";
import { ClassificarFiltrarCategoria } from "@/components/ClassificarFiltrarCategoria";
import { getCategoriaIdPorSlugs, getProdutosPorCategoriaId, getCategoriasProduto, getCategoriasProdutoParaMenu, getCategoriaIdsPorProdutos } from "@/lib/produtos-completo";

type Props = { params: Promise<{ slug?: string[] }> };

export default async function CategoriaPage({ params }: Props) {
  let slugSegments: string[] | undefined;
  try {
    const p = await params;
    slugSegments = p.slug ?? [];
  } catch {
    notFound();
  }
  const slugs = slugSegments ?? [];

  if (slugs.length === 0) {
    const menu = await getCategoriasProdutoParaMenu();
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <StoreHeader />
        <main className="mx-auto max-w-7xl px-4 pt-[130px] pb-10 sm:px-6 sm:pt-[140px] md:pt-[150px] md:pb-14 lg:px-8">
          <h1 className="mb-8 text-2xl font-bold text-white">Categorias</h1>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {menu.map((c) => (
              <Link
                key={c.id}
                href={c.href}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-white transition-colors hover:border-zinc-600 hover:bg-zinc-800/50"
              >
                <span className="font-semibold">{c.nome}</span>
                {c.filhos.length > 0 && (
                  <p className="mt-2 text-sm text-zinc-400">{c.filhos.length} subcategorias</p>
                )}
              </Link>
            ))}
          </div>
        </main>
        <StoreFooter />
      </div>
    );
  }

  let categorias;
  let categoriaId: string | null;
  let produtos: Awaited<ReturnType<typeof getProdutosPorCategoriaId>>;
  try {
    categorias = await getCategoriasProduto();
    categoriaId = await getCategoriaIdPorSlugs(slugs);
    if (!categoriaId) notFound();
    produtos = await getProdutosPorCategoriaId(categoriaId);
  } catch (e) {
    console.error("Erro em /categorias/[slug]:", e);
    notFound();
  }

  const cat = categorias!.find((c) => c.id === categoriaId!);
  const titulo = cat?.nome ?? "Categoria";

  // Subcategorias para filtro de gênero: filhos da categoria atual ou irmãos (se for subcategoria)
  const subcategorias = categorias!.filter(
    (c) => c.parent_id === (cat?.parent_id ?? cat?.id ?? null)
  ).map((c) => ({ id: c.id, nome: c.nome }));

  const produtoIds = produtos.map((p) => p.id ?? p.id_externo).filter(Boolean) as string[];
  const mapaCat = await getCategoriaIdsPorProdutos(produtoIds);
  const categoriaIdsByProduto: Record<string, string[]> = {};
  mapaCat.forEach((ids, id) => { categoriaIdsByProduto[id] = ids; });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StoreHeader />
      <main className="mx-auto max-w-7xl px-4 pt-[130px] pb-10 sm:px-6 sm:pt-[140px] md:pt-[150px] md:pb-14 lg:px-8">
        <nav className="mb-8 text-sm text-zinc-400">
          <Link href="/" className="hover:text-white">Início</Link>
          <span className="mx-2">/</span>
          <Link href="/categorias" className="hover:text-white">Categorias</Link>
          {slugs.length > 0 && (
            <>
              <span className="mx-2">/</span>
              <span className="text-white">{titulo}</span>
            </>
          )}
        </nav>
        <h1 className="mb-8 text-2xl font-bold text-white md:text-3xl">{titulo}</h1>
        {produtos.length === 0 ? (
          <p className="py-12 text-center text-zinc-400">Nenhum produto nesta categoria no momento.</p>
        ) : (
          <ClassificarFiltrarCategoria
            produtos={produtos}
            subcategorias={subcategorias}
            categoriaIdsByProduto={categoriaIdsByProduto}
          />
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
