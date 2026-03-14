import { getLojaConfig } from "@/lib/loja-config";
import { PersonaliseClient } from "./PersonaliseClient";

export default async function AdminPersonalisePage() {
  const [logo_marca, favicon, icone_mercado_pago, icone_pix, icone_ps4, icone_ps5] = await Promise.all([
    getLojaConfig("logo_marca"),
    getLojaConfig("favicon"),
    getLojaConfig("icone_mercado_pago"),
    getLojaConfig("icone_pix"),
    getLojaConfig("icone_ps4"),
    getLojaConfig("icone_ps5"),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Personalize sua Loja
        </h1>
        <p className="mt-2 text-zinc-400">
          Logo da marca, favicon, ícones de pagamento e consoles.
        </p>
      </header>

      <PersonaliseClient
        logoUrl={logo_marca?.url ?? null}
        faviconUrl={favicon?.url ?? null}
        iconeMercadoPagoUrl={icone_mercado_pago?.url ?? null}
        iconePixUrl={icone_pix?.url ?? null}
        iconePS4Url={icone_ps4?.url ?? null}
        iconePS5Url={icone_ps5?.url ?? null}
      />
    </div>
  );
}
