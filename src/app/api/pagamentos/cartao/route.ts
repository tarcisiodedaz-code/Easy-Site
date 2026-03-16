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
      .select("id, numero, total, cliente_nome, cliente_email, cliente_cpf, situacao")
      .eq("id", pedidoId)
      .single();

    if (errPedido || !pedido || pedido.situacao !== "pendente") {
      return NextResponse.json({ erro: "Pedido não encontrado ou já processado." }, { status: 400 });
    }

    const { data: itens } = await supabase
      .from("pedido_itens")
      .select("produto_id, produto_nome, preco_unitario, quantidade")
      .eq("pedido_id", pedidoId);

    const parcelas = Math.max(1, Math.min(Number(installments) || 1, 24));
    const nome = (payer_nome ?? pedido.cliente_nome ?? "").trim() || "Cliente";
    const cpf = (pedido as { cliente_cpf?: string | null }).cliente_cpf ?? null;

    const result = await criarPagamentoCartao({
      transaction_amount: Number(pedido.total),
      token: token.trim(),
      installments: parcelas,
      payer_email: pedido.cliente_email,
      payer_nome: nome,
      payer_cpf: cpf,
      description: `Pedido #${pedido.numero} - Easy Games`,
      pedido_id: pedido.id,
      items: (itens ?? []).map((i: { produto_id: string; produto_nome: string; preco_unitario: number; quantidade: number }) => ({
        id: i.produto_id,
        title: i.produto_nome,
        quantity: i.quantidade,
        unit_price: i.preco_unitario,
        category_id: "games",
        description: i.produto_nome,
      })),
      statement_descriptor: "EASYGAMES",
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
