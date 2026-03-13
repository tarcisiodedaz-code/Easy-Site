import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ pedidos: [], erro: "Não autenticado" }, { status: 401 });
    }

    // Busca pedidos do cliente pelo email
    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select(`
        id,
        numero,
        total,
        situacao,
        forma_pagamento,
        created_at,
        pedido_itens (
          id,
          produto_id,
          produto_nome,
          preco_unitario,
          quantidade,
          conta_entrega_id,
          contas_entrega (
            email_conta,
            senha_conta,
            dados_extras
          )
        )
      `)
      .eq("cliente_email", user.email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar pedidos:", error);
      return NextResponse.json({ pedidos: [], erro: error.message }, { status: 500 });
    }

    return NextResponse.json({ pedidos: pedidos ?? [] });
  } catch (e) {
    console.error("Erro em meus-pedidos:", e);
    return NextResponse.json({ pedidos: [], erro: "Erro interno" }, { status: 500 });
  }
}
