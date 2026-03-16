import { createAdminClient } from "./supabase-admin";

export type DashboardStats = {
  clientesTotal: number;
  clientesNovosMes: number;
  vendasAprovadasCount: number;
  vendasAprovadasTotal: number;
  canceladosCount: number;
  siteViews: number;
  produtosAtivos: number;
  promocoesCount: number;
};

export type PedidoPorDia = {
  data: string;
  total: number;
  label: string;
};

export type UltimoPedido = {
  id: string;
  numero: number;
  cliente_nome: string;
  total: number;
  situacao: string;
  created_at: string;
};

function startOfMonthISO(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Estatísticas para o dashboard admin. Usar apenas em contexto servidor com sessão admin.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient();
  const inicioMes = startOfMonthISO();

  const [clientesRes, clientesMesRes, pedidosAprovadosRes, canceladosRes, produtosRes] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", inicioMes),
      supabase
        .from("pedidos")
        .select("id, total")
        .in("situacao", ["pago", "entregue"]),
      supabase
        .from("pedidos")
        .select("id", { count: "exact", head: true })
        .eq("situacao", "cancelado"),
      supabase.from("produtos_loja").select("id, ativo, preco, preco_original"),
    ]);

  const clientesTotal = clientesRes.count ?? 0;
  const clientesNovosMes = clientesMesRes.count ?? 0;
  const pedidosAprovados = pedidosAprovadosRes.data ?? [];
  const vendasAprovadasCount = pedidosAprovados.length;
  const vendasAprovadasTotal = pedidosAprovados.reduce((s, p) => s + Number(p.total), 0);
  const canceladosCount = canceladosRes.count ?? 0;
  const produtos = (produtosRes.data ?? []) as { ativo?: boolean; preco: number; preco_original: number }[];
  const produtosAtivos = produtos.filter((p) => p.ativo !== false).length;
  const promocoesCount = produtos.filter((p) => Number(p.preco) < Number(p.preco_original)).length;

  return {
    clientesTotal,
    clientesNovosMes,
    vendasAprovadasCount,
    vendasAprovadasTotal,
    canceladosCount,
    siteViews: 1247,
    produtosAtivos,
    promocoesCount,
  };
}

/**
 * Pedidos agrupados por dia nos últimos 7 dias.
 */
export async function getPedidosPorDia(): Promise<PedidoPorDia[]> {
  const supabase = createAdminClient();
  const hoje = new Date();
  const seteDiasAtras = new Date(hoje);
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);
  seteDiasAtras.setHours(0, 0, 0, 0);

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("created_at")
    .gte("created_at", seteDiasAtras.toISOString());

  const porDia: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    porDia[key] = 0;
  }

  for (const p of pedidos ?? []) {
    const key = (p as { created_at: string }).created_at.slice(0, 10);
    if (porDia[key] !== undefined) porDia[key]++;
  }

  return Object.entries(porDia)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, total], i) => ({
      data,
      total,
      label: new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
    }));
}

/**
 * Últimos N pedidos para a tabela rápida.
 */
export async function getUltimosPedidos(limite: number): Promise<UltimoPedido[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("pedidos")
    .select("id, numero, cliente_nome, total, situacao, created_at")
    .order("created_at", { ascending: false })
    .limit(limite);

  return (data ?? []) as UltimoPedido[];
}

export type VendasELucro = {
  valorBruto: number;
  lucroTotal: number;
};

/**
 * Valor bruto das vendas (pedidos pago + entregue) e lucro total (receita - custo dos itens).
 */
export async function getVendasELucro(): Promise<VendasELucro> {
  const supabase = createAdminClient();
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("id, total")
    .in("situacao", ["pago", "entregue"]);
  const valorBruto = (pedidos ?? []).reduce((s, p) => s + Number(p.total), 0);
  const pedidoIds = (pedidos ?? []).map((p: { id: string }) => p.id);
  if (pedidoIds.length === 0) return { valorBruto, lucroTotal: 0 };

  const { data: itens } = await supabase
    .from("pedido_itens")
    .select("produto_id, preco_unitario, quantidade")
    .in("pedido_id", pedidoIds);
  if (!itens?.length) return { valorBruto, lucroTotal: 0 };

  const produtoIds = [...new Set((itens as { produto_id: string }[]).map((i) => i.produto_id))];
  const { data: produtos } = await supabase
    .from("produtos_loja")
    .select("id, preco_custo")
    .in("id", produtoIds);
  const custoPorId = new Map(
    (produtos ?? []).map((p: { id: string; preco_custo: number | null }) => [
      p.id,
      Number(p.preco_custo) || 0,
    ])
  );
  let lucroTotal = 0;
  for (const i of itens as { produto_id: string; preco_unitario: number; quantidade: number }[]) {
    const custo = custoPorId.get(i.produto_id) ?? 0;
    lucroTotal += (Number(i.preco_unitario) - custo) * (i.quantidade || 1);
  }
  return { valorBruto, lucroTotal };
}

export type JogoMaisVendido = {
  produto_id: string;
  nome: string;
  quantidade: number;
};

/**
 * Jogos que mais venderam (por quantidade), considerando apenas pedidos pago/entregue.
 */
export async function getJogosMaisVendidos(limite: number = 10): Promise<JogoMaisVendido[]> {
  const supabase = createAdminClient();
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("id")
    .in("situacao", ["pago", "entregue"]);
  const pedidoIds = (pedidos ?? []).map((p: { id: string }) => p.id);
  if (pedidoIds.length === 0) return [];

  const { data: itens } = await supabase
    .from("pedido_itens")
    .select("produto_id, quantidade")
    .in("pedido_id", pedidoIds);
  if (!itens?.length) return [];

  const totalPorProduto = new Map<string, number>();
  for (const row of itens as { produto_id: string; quantidade: number }[]) {
    totalPorProduto.set(
      row.produto_id,
      (totalPorProduto.get(row.produto_id) ?? 0) + (row.quantidade || 1)
    );
  }
  const idsOrdenados = [...totalPorProduto.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([id]) => id);
  if (idsOrdenados.length === 0) return [];

  const { data: produtos } = await supabase
    .from("produtos_loja")
    .select("id, nome")
    .in("id", idsOrdenados)
    .is("deletado_em", null);
  const nomesPorId = new Map(
    (produtos ?? []).map((p: { id: string; nome: string }) => [p.id, p.nome])
  );
  return idsOrdenados.map((id) => ({
    produto_id: id,
    nome: nomesPorId.get(id) ?? "—",
    quantidade: totalPorProduto.get(id) ?? 0,
  }));
}

export type EstoqueSemVenda = {
  produto_id: string;
  nome: string;
  quantidade_estoque: number;
  ultima_venda_em: string | null;
  dias_sem_vender: number | null;
};

/**
 * Produtos com estoque que estão há mais tempo sem vender (ou nunca venderam).
 */
export async function getMaisTempoEstoqueSemVender(
  limite: number = 10
): Promise<EstoqueSemVenda[]> {
  const supabase = createAdminClient();
  const { data: produtos } = await supabase
    .from("produtos_loja")
    .select("id, nome, quantidade_estoque, gerenciar_estoque")
    .is("deletado_em", null)
    .eq("gerenciar_estoque", true)
    .gt("quantidade_estoque", 0);
  const lista = (produtos ?? []) as {
    id: string;
    nome: string;
    quantidade_estoque: number;
    gerenciar_estoque: boolean;
  }[];
  if (lista.length === 0) return [];

  const produtoIds = lista.map((p) => p.id);
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("id, created_at")
    .in("situacao", ["pago", "entregue"]);
  const pedidoIds = (pedidos ?? []).map((p: { id: string }) => p.id);
  const pedidoCreatedAt = new Map(
    (pedidos ?? []).map((p: { id: string; created_at: string }) => [p.id, p.created_at])
  );

  let ultimaVendaPorProduto = new Map<string, string>();
  if (pedidoIds.length > 0) {
    const { data: itens } = await supabase
      .from("pedido_itens")
      .select("pedido_id, produto_id")
      .in("pedido_id", pedidoIds)
      .in("produto_id", produtoIds);
    for (const i of itens ?? []) {
      const row = i as { pedido_id: string; produto_id: string };
      const dataPedido = pedidoCreatedAt.get(row.pedido_id);
      if (!dataPedido) continue;
      const atual = ultimaVendaPorProduto.get(row.produto_id);
      if (!atual || dataPedido > atual)
        ultimaVendaPorProduto.set(row.produto_id, dataPedido);
    }
  }

  const hoje = new Date();
  const comDias = lista.map((p) => {
    const ultima = ultimaVendaPorProduto.get(p.id) ?? null;
    const dias_sem_vender = ultima
      ? Math.floor((hoje.getTime() - new Date(ultima).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    return {
      produto_id: p.id,
      nome: p.nome,
      quantidade_estoque: p.quantidade_estoque ?? 0,
      ultima_venda_em: ultima,
      dias_sem_vender,
    };
  });
  comDias.sort((a, b) => {
    if (a.ultima_venda_em == null && b.ultima_venda_em == null) return 0;
    if (a.ultima_venda_em == null) return -1;
    if (b.ultima_venda_em == null) return 1;
    return a.ultima_venda_em.localeCompare(b.ultima_venda_em);
  });
  return comDias.slice(0, limite);
}
