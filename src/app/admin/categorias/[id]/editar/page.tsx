import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoriaPorId } from "@/lib/categorias";
import { ICONES_DISPONIVEIS } from "@/lib/categorias";
import { FormCategoria } from "../../FormCategoria";

export default async function EditarCategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categoria = await getCategoriaPorId(id);
  if (!categoria) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/admin/categorias" className="mb-8 inline-block text-sm text-zinc-400 hover:text-white">
        ← Categorias
      </Link>
      <h1 className="text-2xl font-bold text-white">Editar categoria</h1>
      <p className="mt-1 text-zinc-400">{categoria.nome}</p>
      <FormCategoria icones={ICONES_DISPONIVEIS} categoria={categoria} />
    </div>
  );
}
