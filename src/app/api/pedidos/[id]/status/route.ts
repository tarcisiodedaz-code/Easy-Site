import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consultarPagamento } from "@/lib/mercado-pago";

/** Converte status_detail do MP em mensagem legível para o usuário. */
function traduzirStatusDetailRejeicao(statusDetail: string): string {
  const map: Record<string, string> = {
    rejected_insufficient_data: "Dados insuficientes para processar o PIX. Verifique nome, e-mail e CPF.",
    rejected_by_bank: "Pagamento recusado pelo banco. Tente outro meio de pagamento.",
    rejected_by_regulations: "Pagamento recusado por política do Mercado Pago.",
  };
  return map[statusDetail] ?? `Pagamento recusado. (${statusDetail})`;
}

/**
 * Retorna o status do pedido e do pagamento no MP (para polling no checkout PIX).
 * GET /api/pedidos/[id]/status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pedidoId } = await params;
  if (!pedidoId) {
    return NextResponse.json({ erro: "ID do pedido é obrigatório." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select("id, situacao, payment_id")
    .eq("id", pedidoId)
    .single();

  if (error || !pedido) {
    return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
  }

  if (pedido.situacao === "pago" || pedido.situacao === "rejeitado") {
    let mensagem: string | undefined;
    if (pedido.situacao === "rejeitado" && pedido.payment_id) {
      const mp = await consultarPagamento(pedido.payment_id);
      if (mp.status_detail) mensagem = traduzirStatusDetailRejeicao(mp.status_detail);
    }
    return NextResponse.json({
      pedidoId: pedido.id,
      situacao: pedido.situacao,
      payment_status: pedido.situacao,
      ...(mensagem ? { mensagem } : {}),
    });
  }

  if (pedido.payment_id) {
    const mp = await consultarPagamento(pedido.payment_id);
    if (mp.status) {
      const situacao =
        mp.status === "approved" ? "pago" : mp.status === "rejected" ? "rejeitado" : "pendente";
      const mensagem =
        situacao === "rejeitado" && mp.status_detail
          ? traduzirStatusDetailRejeicao(mp.status_detail)
          : undefined;
      return NextResponse.json({
        pedidoId: pedido.id,
        situacao,
        payment_status: mp.status,
        status_detail: mp.status_detail ?? undefined,
        mensagem: mensagem ?? undefined,
      });
    }
  }

  return NextResponse.json({
    pedidoId: pedido.id,
    situacao: pedido.situacao,
    payment_status: "pending",
  });
}
