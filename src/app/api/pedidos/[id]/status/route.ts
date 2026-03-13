import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consultarPagamento } from "@/lib/mercado-pago";

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
    return NextResponse.json({
      pedidoId: pedido.id,
      situacao: pedido.situacao,
      payment_status: pedido.situacao,
    });
  }

  if (pedido.payment_id) {
    const mp = await consultarPagamento(pedido.payment_id);
    if (mp.status) {
      const situacao =
        mp.status === "approved" ? "pago" : mp.status === "rejected" ? "rejeitado" : "pendente";
      return NextResponse.json({
        pedidoId: pedido.id,
        situacao,
        payment_status: mp.status,
      });
    }
  }

  return NextResponse.json({
    pedidoId: pedido.id,
    situacao: pedido.situacao,
    payment_status: "pending",
  });
}
