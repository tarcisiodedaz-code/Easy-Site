import type { PedidoComItens } from "./pedidos";

/**
 * Envia e-mail de entrega ao cliente com os dados da conta (conta filho).
 * Configure SMTP/Resend/SendGrid via env e implemente o envio real.
 */
export async function enviarEmailEntrega(pedido: PedidoComItens): Promise<boolean> {
  const apiUrl = process.env.EMAIL_API_URL;
  const apiKey = process.env.EMAIL_API_KEY;
  if (!apiUrl || !apiKey) {
    console.warn("EMAIL_API_URL ou EMAIL_API_KEY não configurados. Simulando envio.");
    return true;
  }
  const corpo = buildCorpoEmail(pedido);
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        to: pedido.cliente_email,
        subject: `Easy Games - Entrega do pedido #${pedido.numero}`,
        html: corpo,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error("Erro ao enviar e-mail de entrega:", e);
    return false;
  }
}

function buildCorpoEmail(pedido: PedidoComItens): string {
  const itensHtml = pedido.itens
    .map(
      (i) =>
        `<tr><td>${i.produto_nome}</td><td>${i.quantidade}</td><td>R$ ${(i.preco_unitario * i.quantidade).toFixed(2)}</td>` +
        (i.conta
          ? `<td>E-mail: ${i.conta.email_conta || "-"} | Senha: ${i.conta.senha_conta || "-"} ${i.conta.dados_extras ? `<br/>${i.conta.dados_extras}` : ""}</td>`
          : "<td>Conta não atribuída</td>") +
        `</tr>`
    )
    .join("");
  return `
    <h2>Pedido #${pedido.numero} - Easy Games</h2>
    <p>Olá, ${pedido.cliente_nome}!</p>
    <p>Segue os dados de acesso dos jogos:</p>
    <table border="1" cellpadding="8">
      <tr><th>Produto</th><th>Qtd</th><th>Valor</th><th>Dados de acesso</th></tr>
      ${itensHtml}
    </table>
    <p>Total: R$ ${pedido.total.toFixed(2)}</p>
    <p>Qualquer dúvida, responda este e-mail ou fale conosco pelo WhatsApp.</p>
  `;
}
