import { getLojaConfig } from "@/lib/loja-config";
import { BannerDivisorClient } from "./BannerDivisorClient";

export default async function BannerDivisorPage() {
  const config = await getLojaConfig("banner_divisor");

  const defaultConfig = {
    ativo: true,
    titulo_principal: "GARANTIA EASY GAMES: DO PRESENTE PARA O FUTURO.",
    imagem_fundo_url: null,
    itens: [
      {
        icone_url: null,
        titulo: "COMPRA SEGURA & PROTEÇÃO TOTAL",
        descricao: "Garantia de recebimento ou seu dinheiro de volta.",
      },
      {
        icone_url: null,
        titulo: "ENVIO IMEDIATO & DIGITAL",
        descricao: "Seus códigos em segundos, jogue agora.",
      },
      {
        icone_url: null,
        titulo: "ECOSSISTEMA COMPLETO GAMER",
        descricao: "De clássicos a pré-vendas, tudo em um só lugar.",
      },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Banner Divisor
        </h1>
        <p className="mt-2 text-zinc-400">
          Configure o banner de garantias exibido entre o carousel e a pré-venda.
        </p>
      </header>

      <BannerDivisorClient config={config ?? defaultConfig} />
    </div>
  );
}
