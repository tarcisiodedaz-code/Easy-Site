import { getAllLojaConfig } from "@/lib/loja-config";
import { FormAparencia } from "./FormAparencia";

export default async function AdminAparenciaPage() {
  const config = await getAllLojaConfig();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Aparência da loja
        </h1>
        <p className="mt-2 text-zinc-400">
          Altere a barra superior, o carrossel da home e o banner de pré-venda. As imagens você pode colocar manualmente (URL).
        </p>
      </header>

      <FormAparencia config={config} />
    </div>
  );
}
