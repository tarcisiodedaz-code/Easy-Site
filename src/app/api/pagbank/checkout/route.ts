import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { criarCheckoutPagBank } from "@/lib/pagbank";

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  return "https://easygames.store";
}

function parseTelefone(telefone?: string | null): { country: "+55"; area: string; number: string } | undefined {
  if (!telefone) return undefined;
  const d = telefone.replace(/\D/g, "");
  const sem55 = d.startsWith("55") ? d.slice(2) : d;
  const area = sem55.slice(0, 2);
  const number = sem55.slice(2);
  if (area.length !== 2) return undefined;
  if (number.length < 8) return undefined;
  const num9 = number.length >= 9 ? number.slice(0, 9) : number;
  return { country: "+55", area, number: num9 };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pedidoId, cliente_nome, cliente_email, cliente_cpf, cliente_telefone } = body as {
      pedidoId: string;
      cliente_nome: string;
      cliente_email: string;
      cliente_cpf?: string;
      cliente_telefone?: string;
    };

    if (!pedidoId?.trim()) return NextResponse.json({ ok: false, erro: "pedidoId é obrigatório." }, { status: 400 });

    const supabase = createAdminClient();
    const { data: pedido, error: errPedido } = await supabase
      .from("pedidos")
      .select("id, numero, total, situacao")
      .eq("id", pedidoId)
      .single();

    if (errPedido || !pedido) return NextResponse.json({ ok: false, erro: "Pedido não encontrado." }, { status: 404 });
    if (pedido.situacao !== "pendente") return NextResponse.json({ ok: false, erro: "Pedido já processado." }, { status: 400 });

    const { data: itens } = await supabase
      .from("pedido_itens")
      .select("produto_id, produto_nome, preco_unitario, quantidade")
      .eq("pedido_id", pedidoId);

    const items = (itens ?? []).map((i: { produto_id: string; produto_nome: string; preco_unitario: number; quantidade: number }) => ({
      reference_id: String(i.produto_id).slice(0, 100),
      name: String(i.produto_nome).slice(0, 100),
      quantity: Number(i.quantidade) || 1,
      unit_amount: Math.max(0, Math.round(Number(i.preco_unitario) * 100)),
    }));
    if (items.length === 0) return NextResponse.json({ ok: false, erro: "Pedido sem itens." }, { status: 400 });

    const baseUrl = getBaseUrl();
    const redirectUrl = `${baseUrl}/checkout?pedido=${encodeURIComponent(pedidoId)}`;
    const returnUrl = `${baseUrl}/checkout?pedido=${encodeURIComponent(pedidoId)}`;
    const webhookUrl = `${baseUrl}/api/webhooks/pagbank`;

    const taxId = (cliente_cpf ?? "").replace(/\D/g, "").slice(0, 14);
    const phone = parseTelefone(cliente_telefone);

    const r = await criarCheckoutPagBank({
      reference_id: pedidoId,
      customer: {
        name: String(cliente_nome ?? "").trim().slice(0, 100),
        email: String(cliente_email ?? "").trim().slice(0, 120),
        ...(taxId ? { tax_id: taxId } : {}),
        ...(phone ? { phone } : {}),
      },
      items,
      redirect_url: redirectUrl,
      return_url: returnUrl,
      notification_urls: [webhookUrl],
      payment_notification_urls: [webhookUrl],
    });

    if (!r.ok || !r.pay_url || !r.checkout_id) {
      return NextResponse.json({ ok: false, erro: r.erro ?? "Erro ao criar checkout." }, { status: 400 });
    }

    await supabase.from("pedidos").update({ payment_id: r.checkout_id }).eq("id", pedidoId);

    return NextResponse.json({ ok: true, pay_url: r.pay_url });
  } catch (e) {
    return NextResponse.json({ ok: false, erro: e instanceof Error ? e.message : "Erro desconhecido." }, { status: 500 });
  }
}

