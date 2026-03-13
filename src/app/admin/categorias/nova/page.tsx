import Link from "next/link";
import { ICONES_DISPONIVEIS } from "@/lib/categorias";
import { FormCategoria } from "../FormCategoria";

export default function NovaCategoriaPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/admin/categorias" className="mb-8 inline-block text-sm text-zinc-400 hover:text-white">
        ← Categorias
      </Link>
      <h1 className="text-2xl font-bold text-white">Nova categoria</h1>
      <FormCategoria icones={ICONES_DISPONIVEIS} />
    </div>
  );
}
