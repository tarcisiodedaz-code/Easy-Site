import { getLojaConfig } from "@/lib/loja-config";
import { BannerDivisorClient } from "./BannerDivisorClient";
import { DEFAULTS } from "@/types/loja-config";

export default async function BannerDivisorPage() {
  const config = await getLojaConfig("banner_divisor");
  const defaultConfig = DEFAULTS.banner_divisor!;

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
