import { getLojaConfig } from "@/lib/loja-config";
import { PagamentosClient } from "./PagamentosClient";

export default async function AdminConfiguracoesPagamentosPage() {
  const config = await getLojaConfig("mercado_pago");

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">Configurações → Pagamentos</h1>
        <p className="mt-2 text-zinc-400">
          Credenciais do Mercado Pago para checkout transparente (PIX e cartão de crédito no seu site).
        </p>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Mercado Pago</h2>
        <PagamentosClient
          initialPublicKey={config?.publicKey ?? ""}
          initialAccessToken={config?.accessToken ?? ""}
          initialSandbox={config?.sandbox ?? true}
          initialTaxaCartao={config?.taxaCartao ?? 5}
        />
      </section>

      <section className="mt-8 rounded-xl border border-amber-900/50 bg-amber-950/20 p-6">
        <h2 className="mb-3 text-lg font-semibold text-amber-200">Webhook (notificações de pagamento)</h2>
        <p className="mb-4 text-sm text-zinc-400">
          O Mercado Pago precisa de uma <strong className="text-zinc-300">URL pública</strong> para avisar quando um pagamento for aprovado ou recusado. Sem isso, o pedido não muda para &quot;Pago&quot; sozinho após o cliente pagar o PIX.
        </p>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-zinc-300">Se você ainda não tem domínio (desenvolvimento local):</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-500">
              <li>Use um túnel como <strong className="text-zinc-400">ngrok</strong>: rode <code className="rounded bg-zinc-800 px-1">ngrok http 3000</code> e copie a URL (ex.: <code className="rounded bg-zinc-800 px-1">https://abc123.ngrok.io</code>).</li>
              <li>No painel do Mercado Pago → Suas integrações → Webhooks, cadastre: <code className="rounded bg-zinc-800 px-1">https://SUA-URL-DO-NGROK/api/webhooks/mercado-pago</code>.</li>
              <li>Assim o MP consegue chamar seu localhost através do túnel.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-zinc-300">Quando tiver um domínio (site no ar):</p>
            <p className="mt-2 text-zinc-500">
              Cadastre no Mercado Pago: <code className="rounded bg-zinc-800 px-1">https://seu-dominio.com/api/webhooks/mercado-pago</code> (troque <em>seu-dominio.com</em> pelo seu domínio real).
            </p>
          </div>
          <p className="text-zinc-500">
            O webhook é opcional para cartão (a resposta já vem na hora). Para <strong className="text-zinc-400">PIX</strong>, sem webhook o cliente pode pagar mas o pedido só atualiza se você consultar o status manualmente ou usar o polling na página de checkout.
          </p>
        </div>
      </section>
    </div>
  );
}
