import { supabase } from "./supabase";

export type SituacaoPedido = "pendente" | "pago" | "entregue" | "cancelado" | "rejeitado";
export type FormaPagamento = "mercado_pago" | "pix";

export type Pedido = {
  id: string;
  numero: number;
  cliente_nome: string;
  cliente_email: string;
  /** CPF do comprador (opcional no schema antigo). */
  cliente_cpf?: string | null;
  total: number;
  situacao: SituacaoPedido;
  forma_pagamento: FormaPagamento;
  payment_id: string | null;
  pix_txid: string | null;
  email_enviado_em: string | null;
  created_at: string;
  updated_at: string;
};

export type PedidoItem = {
  id: string;
  pedido_id: string;
  produto_id: string;
  produto_nome: string;
  preco_unitario: number;
  quantidade: number;
  conta_entrega_id: string | null;
  created_at?: string;
};

export type ContaEntrega = {
  id: string;
  produto_id: string;
  email_conta: string | null;
  senha_conta: string | null;
  dados_extras: string | null;
  usado: boolean;
  created_at?: string;
};

export type PedidoComItens = Pedido & { itens: (PedidoItem & { conta?: ContaEntrega | null })[] };

type FiltrosPedidos = {
  situacao?: SituacaoPedido;
  forma_pagamento?: FormaPagamento;
  pagina?: number;
  por_pagina?: number;
};

export async function getPedidos(filtros: FiltrosPedidos = {}): Promise<{
  pedidos: PedidoComItens[];
  total: number;
  paginas: number;
}> {
  const { situacao, forma_pagamento, pagina = 1, por_pagina = 50 } = filtros;
  let query = supabase
    .from("pedidos")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (situacao) query = query.eq("situacao", situacao);
  if (forma_pagamento) query = query.eq("forma_pagamento", forma_pagamento);

  const from = (pagina - 1) * por_pagina;
  const to = from + por_pagina - 1;
  const { data: pedidos, error, count } = await query.range(from, to);

  if (error) {
    console.error("Erro ao buscar pedidos:", error);
    return { pedidos: [], total: 0, paginas: 0 };
  }

  const ids = (pedidos ?? []).map((p: Pedido) => p.id);
  if (ids.length === 0) return { pedidos: [], total: count ?? 0, paginas: Math.ceil((count ?? 0) / por_pagina) };

  const { data: itens } = await supabase
    .from("pedido_itens")
    .select("*")
    .in("pedido_id", ids);

  const contaIds = (itens ?? [])
    .map((i: PedidoItem) => i.conta_entrega_id)
    .filter(Boolean) as string[];
  let contas: ContaEntrega[] = [];
  if (contaIds.length > 0) {
    const { data: c } = await supabase.from("contas_entrega").select("*").in("id", contaIds);
    contas = (c ?? []) as ContaEntrega[];
  }
  const contasMap = Object.fromEntries(contas.map((c) => [c.id, c]));

  const itensPorPedido = (itens as PedidoItem[] ?? []).reduce<Record<string, (PedidoItem & { conta?: ContaEntrega | null })[]>>(
    (acc, i) => {
      if (!acc[i.pedido_id]) acc[i.pedido_id] = [];
      acc[i.pedido_id].push({
        ...i,
        conta: i.conta_entrega_id ? contasMap[i.conta_entrega_id] ?? null : null,
      });
      return acc;
    },
    {}
  );

  const pedidosComItens: PedidoComItens[] = (pedidos ?? []).map((p: Pedido) => ({
    ...p,
    itens: itensPorPedido[p.id] ?? [],
  }));

  return {
    pedidos: pedidosComItens,
    total: count ?? 0,
    paginas: Math.ceil((count ?? 0) / por_pagina),
  };
}

export async function getPedidoPorId(id: string): Promise<PedidoComItens | null> {
  const { data: p, error: e1 } = await supabase.from("pedidos").select("*").eq("id", id).maybeSingle();
  if (e1 || !p) return null;

  const { data: itens } = await supabase.from("pedido_itens").select("*").eq("pedido_id", id).order("created_at");
  const contaIds = (itens ?? []).map((i: PedidoItem) => i.conta_entrega_id).filter(Boolean) as string[];
  let contas: ContaEntrega[] = [];
  if (contaIds.length > 0) {
    const { data: c } = await supabase.from("contas_entrega").select("*").in("id", contaIds);
    contas = (c ?? []) as ContaEntrega[];
  }
  const contasMap = Object.fromEntries(contas.map((c) => [c.id, c]));

  const itensComConta = (itens as PedidoItem[] ?? []).map((i) => ({
    ...i,
    conta: i.conta_entrega_id ? contasMap[i.conta_entrega_id] ?? null : null,
  }));

  return { ...(p as Pedido), itens: itensComConta };
}

export async function atualizarSituacaoPedido(id: string, situacao: SituacaoPedido) {
  const { error } = await supabase.from("pedidos").update({ situacao }).eq("id", id);
  return !error;
}

export async function marcarEmailEnviado(id: string) {
  const { error } = await supabase
    .from("pedidos")
    .update({ email_enviado_em: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export async function buscarContaDisponivel(produtoId: string): Promise<ContaEntrega | null> {
  const { data } = await supabase
    .from("contas_entrega")
    .select("*")
    .eq("produto_id", produtoId)
    .eq("usado", false)
    .limit(1)
    .maybeSingle();
  return data as ContaEntrega | null;
}

export async function atribuirContaAoItem(pedidoItemId: string, contaId: string) {
  const { error } = await supabase
    .from("pedido_itens")
    .update({ conta_entrega_id: contaId })
    .eq("id", pedidoItemId);
  if (error) return false;
  const { error: e2 } = await supabase.from("contas_entrega").update({ usado: true }).eq("id", contaId);
  return !e2;
}

/**
 * Subtrai uma unidade (ou quantidade do item) do estoque para cada produto com gerenciar_estoque ativo.
 * Chamar quando o pedido for aprovado (pago).
 */
export async function descontarEstoqueDoPedido(pedidoId: string) {
  const { data: itens } = await supabase
    .from("pedido_itens")
    .select("produto_id, quantidade")
    .eq("pedido_id", pedidoId);

  if (!itens?.length) return;

  for (const item of itens as { produto_id: string; quantidade: number }[]) {
    const { data: prod } = await supabase
      .from("produtos_loja")
      .select("gerenciar_estoque, quantidade_estoque")
      .eq("id", item.produto_id)
      .single();

    if (prod?.gerenciar_estoque && prod.quantidade_estoque != null) {
      const novaQtd = Math.max(0, (prod.quantidade_estoque as number) - item.quantidade);
      await supabase
        .from("produtos_loja")
        .update({ quantidade_estoque: novaQtd })
        .eq("id", item.produto_id);
    }
  }
}
