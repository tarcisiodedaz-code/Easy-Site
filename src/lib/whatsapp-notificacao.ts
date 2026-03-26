/**
 * Notificação de novo pedido para o WhatsApp do lojista.
 * Prioridade: CallMeBot (config no admin) → Twilio (env) → webhook (env).
 */

export type DadosPedidoNotificacao = {
  numero: number;
  cliente_nome: string;
  cliente_email: string;
  /** Telefone/WhatsApp do cliente (opcional). */
  cliente_telefone?: string | null;
  /** Ex.: "pendente" ou "pago". */
  situacao?: string;
  total: number;
  forma_pagamento: string;
  itens: { produto_nome: string; preco_unitario: number; quantidade: number }[];
};

export type OpcoesNotificacao = {
  /** CallMeBot: número com DDD (ex.: 5579999204322) */
  callmebotNumero?: string;
  /** CallMeBot: chave recebida ao ativar no WhatsApp */
  callmebotApikey?: string;
};

function formatarMensagemPedido(dados: DadosPedidoNotificacao): string {
  const status = dados.situacao === "pago" ? "Pago" : "Pendente";
  let tel = "Não informado";
  if (dados.cliente_telefone?.trim()) {
    const dig = dados.cliente_telefone.replace(/\D/g, "");
    const len = dig.length;
    if (len >= 11) {
      const ddd = len === 12 && dig.startsWith("55") ? dig.slice(2, 4) : dig.slice(0, 2);
      const rest = len === 12 && dig.startsWith("55") ? dig.slice(4) : dig.slice(2);
      tel = rest.length >= 9 ? `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}` : dig;
    } else {
      tel = dig;
    }
  }
  const linhas = [
    "🛒 *Novo pedido no site*",
    "",
    `Pedido #${dados.numero}`,
    `Status: ${status}`,
    `Cliente: ${dados.cliente_nome}`,
    `E-mail: ${dados.cliente_email}`,
    `Telefone: ${tel}`,
    `Pagamento: ${dados.forma_pagamento === "pix" ? "PIX" : dados.forma_pagamento}`,
    "",
    "Itens:",
    ...dados.itens.map(
      (i) =>
        `• ${i.produto_nome} x${i.quantidade} — R$ ${(i.preco_unitario * i.quantidade).toFixed(2)}`
    ),
    "",
    `*Total: R$ ${dados.total.toFixed(2)}*`,
  ];
  return linhas.join("\n");
}

const CALLMEBOT_URL = "https://api.callmebot.com/whatsapp.php";

/**
 * Envia notificação do pedido para o WhatsApp configurado.
 * 1) Se opcoes CallMeBot (numero + apikey), usa CallMeBot (gratuito).
 * 2) Senão, Twilio se env vars definidas.
 * 3) Senão, webhook se NOTIFICACAO_PEDIDO_WEBHOOK_URL definido.
 * Não lança erro; falhas são apenas logadas.
 */
export async function notificarPedidoWhatsApp(
  dados: DadosPedidoNotificacao,
  opcoes?: OpcoesNotificacao
): Promise<void> {
  const mensagem = formatarMensagemPedido(dados);
  const { callmebotNumero, callmebotApikey } = opcoes ?? {};
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const destino = process.env.WHATSAPP_NOTIFICACAO_DESTINO;
  const webhookUrl = process.env.NOTIFICACAO_PEDIDO_WEBHOOK_URL;

  if (callmebotNumero?.trim() && callmebotApikey?.trim()) {
    try {
      const digits = callmebotNumero.replace(/\D/g, "");
      const phone = digits.startsWith("55") ? digits : "55" + digits;
      const url = `${CALLMEBOT_URL}?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(mensagem)}&apikey=${encodeURIComponent(callmebotApikey.trim())}`;
      const res = await fetch(url, { method: "GET" });
      const text = await res.text();
      if (!res.ok) {
        console.error("CallMeBot notificação falhou:", res.status, text);
      }
    } catch (e) {
      console.error("Erro ao enviar notificação WhatsApp (CallMeBot):", e);
    }
    return;
  }

  if (accountSid && authToken && from && destino) {
    try {
      const to = destino.startsWith("whatsapp:") ? destino : `whatsapp:+${destino.replace(/\D/g, "")}`;
      const fromNorm = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: to,
        From: fromNorm,
        Body: mensagem,
      });
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        },
        body: body.toString(),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("Twilio WhatsApp notificação falhou:", res.status, err);
      }
    } catch (e) {
      console.error("Erro ao enviar notificação WhatsApp (Twilio):", e);
    }
    return;
  }

  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "novo_pedido",
          mensagem,
          pedido: {
            numero: dados.numero,
            cliente_nome: dados.cliente_nome,
            cliente_email: dados.cliente_email,
            total: dados.total,
            forma_pagamento: dados.forma_pagamento,
            itens: dados.itens,
          },
        }),
      });
      if (!res.ok) {
        console.error("Webhook notificação pedido falhou:", res.status);
      }
    } catch (e) {
      console.error("Erro ao chamar webhook notificação pedido:", e);
    }
  }
}

/**
 * Envia mensagem "Pedido #X aprovado (pago)." para o WhatsApp do lojista.
 * Chamado quando o pagamento é confirmado (webhook).
 */
export async function notificarPedidoAprovadoWhatsApp(
  numeroPedido: number,
  opcoes?: OpcoesNotificacao
): Promise<void> {
  const mensagem = `✅ *Pedido aprovado*\n\nPedido #${numeroPedido} foi pago e está aprovado.`;
  const { callmebotNumero, callmebotApikey } = opcoes ?? {};
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const destino = process.env.WHATSAPP_NOTIFICACAO_DESTINO;
  const webhookUrl = process.env.NOTIFICACAO_PEDIDO_WEBHOOK_URL;

  if (callmebotNumero?.trim() && callmebotApikey?.trim()) {
    try {
      const digits = callmebotNumero.replace(/\D/g, "");
      const phone = digits.startsWith("55") ? digits : "55" + digits;
      const url = `${CALLMEBOT_URL}?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(mensagem)}&apikey=${encodeURIComponent(callmebotApikey.trim())}`;
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) console.error("CallMeBot notificação aprovado falhou:", res.status, await res.text());
    } catch (e) {
      console.error("Erro ao enviar notificação aprovado (CallMeBot):", e);
    }
    return;
  }

  if (accountSid && authToken && from && destino) {
    try {
      const to = destino.startsWith("whatsapp:") ? destino : `whatsapp:+${destino.replace(/\D/g, "")}`;
      const fromNorm = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const body = new URLSearchParams({ To: to, From: fromNorm, Body: mensagem });
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        },
        body: body.toString(),
      });
      if (!res.ok) console.error("Twilio notificação aprovado falhou:", res.status);
    } catch (e) {
      console.error("Erro ao enviar notificação aprovado (Twilio):", e);
    }
    return;
  }

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "pedido_aprovado", mensagem, numeroPedido }),
      });
    } catch (e) {
      console.error("Erro webhook pedido aprovado:", e);
    }
  }
}
