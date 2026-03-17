import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getPedidoPorId,
  buscarContaDisponivel,
  atribuirContaAoItem,
  marcarEmailEnviado,
  descontarEstoqueDoPedido,
} from "@/lib/pedidos";
import { enviarEmailEntrega } from "@/lib/email-entrega";

/**
 * Webhook para confirmação de Pix (ex.: Mercado Pago Pix ou outro provedor).
 * Quando o Pix for pago, o provedor chama esta URL. Atualize o pedido para "pago" e dispara entrega.
 * Payload esperado (ajuste conforme seu provedor): { txid, status } ou { payment_id, status }.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const txid = (body.txid ?? body.pix_txid ?? body.id) as string | undefined;
    const paymentId = body.payment_id as string | undefined;
    const status = (body.status ?? body.payment_status) as string | undefined;

    if (!status || !["approved", "paid", "completed"].includes(status)) {
      return NextResponse.json({ ok: true });
    }

    const query = txid
      ? supabase.from("pedidos").select("id").eq("pix_txid", txid).eq("situacao", "pendente").limit(1)
      : paymentId
        ? supabase.from("pedidos").select("id").eq("payment_id", paymentId).eq("situacao", "pendente").limit(1)
        : null;

    if (!query) return NextResponse.json({ ok: true });

    const { data: pedidos } = await query;

    if (pedidos?.length) {
      const pedidoId = pedidos[0].id;
      await supabase.from("pedidos").update({ situacao: "pago" }).eq("id", pedidoId);
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
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook Pix:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
