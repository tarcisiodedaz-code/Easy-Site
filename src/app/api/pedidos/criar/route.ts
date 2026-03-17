import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { criarPagamentoPix } from "@/lib/mercado-pago";

type Item = { produto_id: string; produto_nome: string; preco_unitario: number; quantidade: number };

/**
 * Cria um pedido (pendente). Se forma_pagamento for "pix", gera PIX no Mercado Pago e retorna QR/Copia e Cola.
 * Body: { cliente_nome, cliente_email, cliente_cpf?, forma_pagamento: "pix" | "credit_card", itens: Item[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cliente_nome, cliente_email, cliente_cpf, forma_pagamento, itens, device_id } = body as {
      cliente_nome: string;
      cliente_email: string;
      cliente_cpf?: string;
      forma_pagamento: "pix" | "credit_card" | "mercado_pago";
      itens: Item[];
      device_id?: string;
    };

    if (!cliente_nome?.trim() || !cliente_email?.trim() || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
    }

    const total = itens.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0);
    const forma = forma_pagamento === "mercado_pago" ? "mercado_pago" : forma_pagamento;

    const insertPayload: Record<string, unknown> = {
      cliente_nome: cliente_nome.trim(),
      cliente_email: cliente_email.trim(),
      total,
      situacao: "pendente",
      forma_pagamento: forma,
    };
    if (cliente_cpf != null && String(cliente_cpf).trim()) {
      insertPayload.cliente_cpf = String(cliente_cpf).trim();
    }

    const { data: pedido, error: errPedido } = await supabase
      .from("pedidos")
      .insert(insertPayload)
      .select("id, numero")
      .single();

    if (errPedido || !pedido) {
      console.error(errPedido);
      return NextResponse.json({ erro: "Erro ao criar pedido." }, { status: 500 });
    }

    await supabase.from("pedido_itens").insert(
      itens.map((i) => ({
        pedido_id: pedido.id,
        produto_id: i.produto_id,
        produto_nome: i.produto_nome,
        preco_unitario: i.preco_unitario,
        quantidade: i.quantidade,
      }))
    );

    if (forma_pagamento === "pix") {
      const pix = await criarPagamentoPix({
        transaction_amount: total,
        payer_email: cliente_email.trim(),
        payer_nome: cliente_nome?.trim() || null,
        payer_cpf: cliente_cpf != null ? String(cliente_cpf).replace(/\D/g, "").slice(0, 11) || null : null,
        description: `Pedido #${pedido.numero} - Easy Games`,
        pedido_id: pedido.id,
        items: itens.map((i) => ({
          id: i.produto_id,
          title: i.produto_nome,
          quantity: i.quantidade,
          unit_price: i.preco_unitario,
          category_id: "games",
          description: i.produto_nome,
        })),
        ...(device_id?.trim() ? { device_id: device_id.trim() } : {}),
      });
      if (pix.ok && pix.payment_id) {
        await supabase
          .from("pedidos")
          .update({
            payment_id: pix.payment_id,
            pix_txid: pix.qr_code ?? pix.ticket_url ?? null,
          })
          .eq("id", pedido.id);
        return NextResponse.json({
          pedidoId: pedido.id,
          numero: pedido.numero,
          total,
          qr_code_base64: pix.qr_code_base64 ?? null,
          copia_e_cola: pix.qr_code ?? pix.ticket_url ?? null,
          ticket_url: pix.ticket_url ?? null,
        });
      }
      return NextResponse.json(
        { erro: pix.erro ?? "Falha ao gerar PIX." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      pedidoId: pedido.id,
      numero: pedido.numero,
      total,
    });
  } catch (e) {
    console.error("Criar pedido:", e);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}
