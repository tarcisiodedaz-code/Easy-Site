import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { notificarPedidoWhatsApp } from "@/lib/whatsapp-notificacao";

type Item = { produto_id: string; produto_nome: string; preco_unitario: number; quantidade: number };

/**
 * Cria um pedido (pendente).
 * Body: { cliente_nome, cliente_email, cliente_cpf?, cliente_telefone?, itens: Item[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cliente_nome, cliente_email, cliente_cpf, cliente_telefone, itens } = body as {
      cliente_nome: string;
      cliente_email: string;
      cliente_cpf?: string;
      cliente_telefone?: string;
      itens: Item[];
    };

    if (!cliente_nome?.trim() || !cliente_email?.trim() || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ erro: "Dados inválidos. Preencha nome, email e adicione itens ao carrinho." }, { status: 400 });
    }

    const total = itens.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0);
    // Mantém "pix" para compatibilidade com o schema atual.
    const forma = "pix";

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
    if (cliente_telefone != null && String(cliente_telefone).trim()) {
      insertPayload.cliente_telefone = String(cliente_telefone).trim().replace(/\D/g, "").slice(0, 15);
    }

    let supabase;
    try {
      supabase = createAdminClient();
    } catch (e) {
      console.error("Erro ao criar cliente Supabase:", e);
      return NextResponse.json({ erro: "Configuração do banco de dados incompleta. Verifique as variáveis de ambiente." }, { status: 500 });
    }

    const { data: pedido, error: errPedido } = await supabase
      .from("pedidos")
      .insert(insertPayload)
      .select("id, numero")
      .single();

    if (errPedido || !pedido) {
      console.error("Erro ao criar pedido no Supabase:", errPedido);
      const detalhe = errPedido?.message || "Erro desconhecido";
      return NextResponse.json({ erro: `Erro ao criar pedido: ${detalhe}` }, { status: 500 });
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

    // Cópia do pedido no WhatsApp do lojista (CallMeBot config no admin, ou Twilio/webhook por env)
    // Lê com admin para não depender de RLS da tabela loja_config
    const { data: configRow } = await supabase
      .from("loja_config")
      .select("valor")
      .eq("chave", "whatsapp_notificacao")
      .maybeSingle();
    const whatsappConfig = configRow?.valor as { ativo?: boolean; numero?: string; apikey?: string } | null;
    const opcoes =
      whatsappConfig?.ativo && whatsappConfig?.numero?.trim() && whatsappConfig?.apikey?.trim()
        ? { callmebotNumero: whatsappConfig.numero.trim(), callmebotApikey: whatsappConfig.apikey.trim() }
        : undefined;
    if (!opcoes?.callmebotNumero || !opcoes?.callmebotApikey) {
      console.warn("WhatsApp notificação: config não encontrada ou inativa em loja_config (chave whatsapp_notificacao). Verifique Admin → Configurações → Notificações.");
    }
    await notificarPedidoWhatsApp(
      {
        numero: pedido.numero,
        cliente_nome: cliente_nome.trim(),
        cliente_email: cliente_email.trim(),
        cliente_telefone: cliente_telefone?.trim() || null,
        situacao: "pendente",
        total,
        forma_pagamento: forma,
        itens: itens.map((i) => ({
          produto_nome: i.produto_nome,
          preco_unitario: i.preco_unitario,
          quantidade: i.quantidade,
        })),
      },
      opcoes
    );

    // Salvar CPF, telefone e nome no perfil do usuário logado para preencher nos próximos pedidos
    try {
      const serverSupabase = await createServerClient();
      const { data: { user } } = await serverSupabase.auth.getUser();
      const emailNorm = cliente_email.trim().toLowerCase();
      if (user?.email?.toLowerCase() === emailNorm) {
        const cpfDigits = cliente_cpf != null ? String(cliente_cpf).replace(/\D/g, "").slice(0, 11) : "";
        const telRaw = cliente_telefone != null ? String(cliente_telefone).replace(/\D/g, "").slice(0, 15) : "";
        const telCom55 = telRaw.startsWith("55") ? telRaw.slice(0, 13) : telRaw ? "55" + telRaw.slice(0, 11) : "";
        const updates: Record<string, string> = { ...(user.user_metadata as Record<string, string> || {}) };
        if (cliente_nome?.trim()) updates.full_name = cliente_nome.trim();
        if (cpfDigits.length === 11) updates.cpf = cpfDigits;
        if (telCom55.length >= 12) updates.phone_number = telCom55;
        if (Object.keys(updates).length > 0) {
          await supabase.auth.admin.updateUserById(user.id, { user_metadata: updates });
        }
      }
    } catch {
      // Não bloqueia a criação do pedido se falhar ao atualizar perfil
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
