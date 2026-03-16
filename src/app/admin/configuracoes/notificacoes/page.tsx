import { getLojaConfig } from "@/lib/loja-config";
import { NotificacoesClient } from "./NotificacoesClient";

export default async function AdminConfiguracoesNotificacoesPage() {
  const config = await getLojaConfig("whatsapp_notificacao");

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">Configurações → Notificações</h1>
        <p className="mt-2 text-zinc-400">
          Receba uma cópia de cada novo pedido no seu WhatsApp. Configure uma vez e pronto.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Pedido no WhatsApp</h2>
        <NotificacoesClient
          initialAtivo={config?.ativo ?? false}
          initialNumero={config?.numero ?? ""}
          initialApikey={config?.apikey ?? ""}
        />
      </section>
    </div>
  );
}
