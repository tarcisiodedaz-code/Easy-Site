/**
 * Notificação de novo pedido para o WhatsApp do lojista.
 * Suporta: Twilio WhatsApp API ou webhook (Zapier/Make/etc.) para enviar ao seu número.
 */

export type DadosPedidoNotificacao = {
  numero: number;
  cliente_nome: string;
  cliente_email: string;
  total: number;
  forma_pagamento: string;
  itens: { produto_nome: string; preco_unitario: number; quantidade: number }[];
};

function formatarMensagemPedido(dados: DadosPedidoNotificacao): string {
  const linhas = [
    "🛒 *Novo pedido no site*",
    "",
    `Pedido #${dados.numero}`,
    `Cliente: ${dados.cliente_nome}`,
    `E-mail: ${dados.cliente_email}`,
    `Pagamento: ${dados.forma_pagamento === "pix" ? "PIX" : dados.forma_pagamento === "mercado_pago" ? "Cartão/MP" : dados.forma_pagamento}`,
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

/**
 * Envia notificação do pedido para o WhatsApp configurado.
 * Usa Twilio WhatsApp API se as variáveis estiverem definidas;
 * caso contrário, chama o webhook (NOTIFICACAO_PEDIDO_WEBHOOK_URL) se definido.
 * Não lança erro; falhas são apenas logadas.
 */
export async function notificarPedidoWhatsApp(dados: DadosPedidoNotificacao): Promise<void> {
  const mensagem = formatarMensagemPedido(dados);
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // ex: whatsapp:+14155238886
  const destino = process.env.WHATSAPP_NOTIFICACAO_DESTINO; // ex: 5579999204322
  const webhookUrl = process.env.NOTIFICACAO_PEDIDO_WEBHOOK_URL;

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
