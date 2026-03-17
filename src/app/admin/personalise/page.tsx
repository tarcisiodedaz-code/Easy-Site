import { getLojaConfig } from "@/lib/loja-config";
import { PersonaliseClient } from "./PersonaliseClient";

export default async function AdminPersonalisePage() {
  const [logo_marca, favicon] = await Promise.all([
    getLojaConfig("logo_marca"),
    getLojaConfig("favicon"),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Logo
        </h1>
        <p className="mt-2 text-zinc-400">
          Logo da marca no header e ícone (favicon) da aba do navegador.
        </p>
      </header>

      <PersonaliseClient
        logoUrl={logo_marca?.url ?? null}
        faviconUrl={favicon?.url ?? null}
      />
    </div>
  );
}
