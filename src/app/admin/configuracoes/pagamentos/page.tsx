import { getLojaConfig } from "@/lib/loja-config";
import { PagamentosClient } from "./PagamentosClient";
import { PagBankClient } from "./PagBankClient";

export default async function AdminConfiguracoesPagamentosPage() {
  const [mp, pb] = await Promise.all([getLojaConfig("mercado_pago"), getLojaConfig("pagbank")]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">Configurações → Pagamentos</h1>
        <p className="mt-2 text-zinc-400">Configurações de pagamento do site.</p>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">PagBank</h2>
        <PagBankClient
          initialToken={pb?.token ?? ""}
          initialSandbox={pb?.sandbox ?? true}
          initialInstallmentsLimit={pb?.installments_limit ?? 12}
          initialInterestFreeInstallments={pb?.interest_free_installments ?? 0}
          initialSoftDescriptor={pb?.soft_descriptor ?? "EASYGAMES"}
        />
      </section>

      <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Mercado Pago</h2>
        <PagamentosClient
          initialPublicKey={mp?.publicKey ?? ""}
          initialAccessToken={mp?.accessToken ?? ""}
          initialSandbox={mp?.sandbox ?? true}
          initialTaxaCartao={mp?.taxaCartao ?? 5}
        />
      </section>
    </div>
  );
}

