import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getAccessTokenForPayment } from "@/lib/mercado-pago";
import {
  getPedidoPorId,
  buscarContaDisponivel,
  atribuirContaAoItem,
  marcarEmailEnviado,
  descontarEstoqueDoPedido,
} from "@/lib/pedidos";
import { enviarEmailEntrega } from "@/lib/email-entrega";
import { getLojaConfig } from "@/lib/loja-config";
import { notificarPedidoAprovadoWhatsApp } from "@/lib/whatsapp-notificacao";

/**
 * Webhook Mercado Pago: notificações de pagamento (payment.approved, payment.rejected, payment.pending).
 * Configure a URL no painel MP: https://seu-dominio.com/api/webhooks/mercado-pago
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body.type as string;
    const data = body.data as { id?: string };

    if (type === "payment" && data?.id) {
      const paymentId = String(data.id);
      const token = await getAccessTokenForPayment();
      if (token) {
        const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payment = await res.json();
        const status = payment.status;

        const supabase = createAdminClient();
        const { data: pedidos } = await supabase
          .from("pedidos")
          .select("id")
          .eq("payment_id", paymentId)
          .limit(1);

        if (pedidos?.length) {
          const pedidoId = pedidos[0].id;
          const situacao =
            status === "approved" ? "pago" : status === "rejected" ? "rejeitado" : "pendente";
          await supabase.from("pedidos").update({ situacao }).eq("id", pedidoId);

          if (status === "approved") {
            await descontarEstoqueDoPedido(pedidoId);
            const pedido = await getPedidoPorId(pedidoId);
            if (pedido) {
              for (const item of pedido.itens) {
                if (item.conta_entrega_id) continue;
                const conta = await buscarContaDisponivel(item.produto_id);
                if (conta) await atribuirContaAoItem(item.id, conta.id);
              }
              const pedidoAtualizado = await getPedidoPorId(pedidoId);
              if (pedidoAtualizado && (await enviarEmailEntrega(pedidoAtualizado))) {
                await marcarEmailEnviado(pedidoId);
              }
              const whatsappConfig = await getLojaConfig("whatsapp_notificacao");
              if (whatsappConfig?.ativo && whatsappConfig?.numero && whatsappConfig?.apikey) {
                void notificarPedidoAprovadoWhatsApp(pedidoAtualizado.numero, {
                  callmebotNumero: whatsappConfig.numero,
                  callmebotApikey: whatsappConfig.apikey,
                });
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook Mercado Pago:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
