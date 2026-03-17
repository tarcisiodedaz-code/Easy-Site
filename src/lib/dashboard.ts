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
