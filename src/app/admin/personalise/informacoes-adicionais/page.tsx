import { getLojaConfig } from "@/lib/loja-config";
import { InformacoesAdicionaisClient } from "./InformacoesAdicionaisClient";

export default async function AdminInformacoesAdicionaisPage() {
  const informacoes_adicionais = await getLojaConfig("informacoes_adicionais");
  const htmlInicial = informacoes_adicionais && typeof informacoes_adicionais === "object" && "html" in informacoes_adicionais
    ? (informacoes_adicionais as { html?: string }).html ?? ""
    : "";

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Informações adicionais
        </h1>
        <p className="mt-2 text-zinc-400">
          Conteúdo exibido na seção &quot;Informações adicionais&quot; em todas as páginas de produto.
        </p>
      </header>

      <InformacoesAdicionaisClient htmlInicial={htmlInicial} />
    </div>
  );
}
