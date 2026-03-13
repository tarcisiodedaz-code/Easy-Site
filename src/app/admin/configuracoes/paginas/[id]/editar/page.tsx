import Link from "next/link";
import { notFound } from "next/navigation";
import { getPaginaPorId } from "@/lib/paginas";
import { FormPagina } from "../../FormPagina";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditarPaginaPage({ params }: Props) {
  const { id } = await params;
  const pagina = await getPaginaPorId(id);

  if (!pagina) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <Link
            href="/admin/configuracoes/paginas"
            className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
          >
            ← Voltar para páginas
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Editar Página
          </h1>
          <p className="mt-2 text-zinc-400">
            Editando: <strong className="text-white">{pagina.titulo}</strong>
          </p>
        </header>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
          <FormPagina pagina={pagina} />
        </div>
      </div>
    </div>
  );
}
