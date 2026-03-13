import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { criarPagamentoCartao } from "@/lib/mercado-pago";
import {
  descontarEstoqueDoPedido,
  getPedidoPorId,
  buscarContaDisponivel,
  atribuirContaAoItem,
  marcarEmailEnviado,
} from "@/lib/pedidos";
import { enviarEmailEntrega } from "@/lib/email-entrega";

/**
 * Cria pagamento com cartão para um pedido já criado.
 * Body: { pedidoId, token, installments, payer_nome }
 * O pedido deve existir e estar pendente; email vem do pedido.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pedidoId, token, installments, payer_nome } = body as {
      pedidoId: string;
      token: string;
      installments?: number;
      payer_nome?: string;
    };

    if (!pedidoId?.trim() || !token?.trim()) {
      return NextResponse.json({ erro: "pedidoId e token são obrigatórios." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: pedido, error: errPedido } = await supabase
      .from("pedidos")
      .select("id, numero, total, cliente_nome, cliente_email, situacao")
      .eq("id", pedidoId)
      .single();

    if (errPedido || !pedido || pedido.situacao !== "pendente") {
      return NextResponse.json({ erro: "Pedido não encontrado ou já processado." }, { status: 400 });
    }

    const parcelas = Math.max(1, Math.min(Number(installments) || 1, 24));
    const nome = (payer_nome ?? pedido.cliente_nome ?? "").trim() || "Cliente";

    const result = await criarPagamentoCartao({
      transaction_amount: Number(pedido.total),
      token: token.trim(),
      installments: parcelas,
      payer_email: pedido.cliente_email,
      payer_nome: nome,
      description: `Pedido #${pedido.numero} - Easy Games`,
      pedido_id: pedido.id,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, status: "rejected", erro: result.erro },
        { status: 200 }
      );
    }

    await supabase
      .from("pedidos")
      .update({
        payment_id: result.payment_id ?? null,
        situacao: result.status === "approved" ? "pago" : result.status === "rejected" ? "rejeitado" : "pendente",
      })
      .eq("id", pedido.id);

    if (result.status === "approved") {
      await descontarEstoqueDoPedido(pedido.id);
      const pedidoComItens = await getPedidoPorId(pedido.id);
      if (pedidoComItens) {
        for (const item of pedidoComItens.itens) {
          if (item.conta_entrega_id) continue;
          const conta = await buscarContaDisponivel(item.produto_id);
          if (conta) await atribuirContaAoItem(item.id, conta.id);
        }
        const atualizado = await getPedidoPorId(pedido.id);
        if (atualizado && (await enviarEmailEntrega(atualizado))) {
          await marcarEmailEnviado(pedido.id);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      status: result.status ?? "pending",
      payment_id: result.payment_id,
      pedidoId: pedido.id,
      numero: pedido.numero,
    });
  } catch (e) {
    console.error("Pagamento cartão:", e);
    return NextResponse.json({ erro: "Erro interno.", ok: false }, { status: 500 });
  }
}
