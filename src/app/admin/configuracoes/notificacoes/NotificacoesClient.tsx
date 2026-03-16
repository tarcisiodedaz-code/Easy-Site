"use client";

import { useState } from "react";

const CALLMEBOT_URL = "https://api.callmebot.com/whatsapp.php";

function buildTestUrl(numero: string, apikey: string): string {
  const num = (numero ?? "").trim().replace(/\D/g, "");
  const phone = num.startsWith("55") ? num : "55" + num;
  const texto = "Teste – Notificação de pedidos Easy Games. Se você recebeu isso, está tudo certo!";
  return `${CALLMEBOT_URL}?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(texto)}&apikey=${encodeURIComponent((apikey ?? "").trim())}`;
}

type Props = {
  initialAtivo: boolean;
  initialNumero: string;
  initialApikey: string;
};

export function NotificacoesClient({
  initialAtivo,
  initialNumero,
  initialApikey,
}: Props) {
  const [ativo, setAtivo] = useState(initialAtivo);
  const [numero, setNumero] = useState(initialNumero);
  const [apikey, setApikey] = useState(initialApikey);
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function handleTestar() {
    setTestando(true);
    setMsg(null);
    const { enviarTesteWhatsApp } = await import("./actions");
    const res = await enviarTesteWhatsApp(numero, apikey);
    setTestando(false);
    setMsg({
      tipo: res.ok ? "ok" : "erro",
      texto: res.mensagem ?? (res.ok ? "Enviado." : "Erro."),
    });
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMsg(null);
    const { salvarWhatsappNotificacao } = await import("./actions");
    const res = await salvarWhatsappNotificacao({ ativo, numero, apikey });
    setSalvando(false);
    if (res.ok) {
      setMsg({ tipo: "ok", texto: "Configuração salva. Você receberá um WhatsApp a cada novo pedido." });
    } else {
      setMsg({ tipo: "erro", texto: res.erro ?? "Erro ao salvar." });
    }
  }

  return (
    <form onSubmit={handleSalvar} className="space-y-6">
      {msg && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            msg.tipo === "ok"
              ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-200"
              : "border-red-900/50 bg-red-950/30 text-red-200"
          }`}
        >
          {msg.texto}
        </div>
      )}

      <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4">
        <h3 className="mb-2 font-semibold text-emerald-200">Como ativar (gratuito)</h3>
        <ol className="list-inside list-decimal space-y-2 text-sm text-zinc-300">
          <li>
            No WhatsApp, adicione o número <strong className="text-white">+34 644 37 67 94</strong> aos seus contatos.
          </li>
          <li>
            Envie a mensagem: <strong className="text-white">&quot;I allow callmebot to send me messages&quot;</strong>
          </li>
          <li>
            Você receberá uma resposta com sua <strong className="text-white">chave API</strong>. Cole essa chave no campo abaixo.
          </li>
          <li>Informe seu número com DDD (ex.: 5579999204322) e salve.</li>
        </ol>
        <p className="mt-3 text-xs text-zinc-500">
          Serviço CallMeBot — uso pessoal, sem custo. A cada novo pedido no site, uma cópia será enviada para seu WhatsApp.
        </p>
        <p className="mt-2 text-xs text-amber-200/90">
          Se parou de funcionar: a chave pode ter expirado. Envie de novo &quot;I allow callmebot to send me messages&quot; para +34 644 37 67 94, receba a nova chave e cole aqui.
        </p>
      </div>

      <details className="rounded-xl border border-zinc-700 bg-zinc-900/50">
        <summary className="cursor-pointer px-4 py-3 font-medium text-zinc-200 hover:bg-zinc-800/50">
          Ver exemplo de mensagens que você receberá no celular
        </summary>
        <div className="space-y-4 border-t border-zinc-700 px-4 py-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">1) Quando alguém faz um pedido (status pendente)</p>
            <pre className="whitespace-pre-wrap rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-sm text-zinc-300 font-sans">
{`🛒 *Novo pedido no site*

Pedido #12
Status: Pendente
Cliente: Nome do Cliente
E-mail: email@exemplo.com
Telefone: (79) 99920-4322
Pagamento: PIX

Itens:
• Nome do Jogo x1 — R$ 99,90

*Total: R$ 99,90*`}
            </pre>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">2) Quando o pagamento for aprovado</p>
            <pre className="whitespace-pre-wrap rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-sm text-zinc-300 font-sans">
{`✅ *Pedido aprovado*

Pedido #12 foi pago e está aprovado.`}
            </pre>
          </div>
        </div>
      </details>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={ativo}
          onChange={(e) => setAtivo(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
        />
        <span className="text-sm font-medium text-zinc-300">Receber cópia dos pedidos no meu WhatsApp</span>
      </label>

      <div>
        <label htmlFor="numero" className="mb-1 block text-sm font-medium text-zinc-300">
          Seu número (WhatsApp)
        </label>
        <input
          id="numero"
          type="text"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="559999204322"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <p className="mt-1 text-xs text-zinc-500">DDD + número, só dígitos (ex.: 5579999204322).</p>
      </div>

      <div>
        <label htmlFor="apikey" className="mb-1 block text-sm font-medium text-zinc-300">
          Chave API (CallMeBot)
        </label>
        <input
          id="apikey"
          type="text"
          value={apikey}
          onChange={(e) => setApikey(e.target.value)}
          placeholder="Cole a chave que você recebeu no WhatsApp"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={handleTestar}
          disabled={testando || !numero.trim() || !apikey.trim()}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-6 py-2.5 font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
        >
          {testando ? "Enviando…" : "Enviar mensagem de teste"}
        </button>
        <button
          type="button"
          onClick={() => window.open(buildTestUrl(numero, apikey), "_blank", "noopener")}
          disabled={!numero.trim() || !apikey.trim()}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-6 py-2.5 font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
        >
          Testar pelo navegador
        </button>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        Se &quot;Enviar mensagem de teste&quot; não chegar mas &quot;Testar pelo navegador&quot; chegar, o servidor onde o site está hospedado pode estar bloqueando o envio; a notificação ao finalizar pedido pode ter o mesmo bloqueio.
      </p>
    </form>
  );
}
