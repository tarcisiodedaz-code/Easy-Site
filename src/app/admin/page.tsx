import Link from "next/link";
import { getDashboardStats, getPedidosPorDia, getUltimosPedidos } from "@/lib/dashboard";
import { GraficoPedidos } from "./dashboard/GraficoPedidos";

function formatarPreco(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

const SITUACAO_LABEL: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
  entregue: "Entregue",
};

const SITUACAO_COR: Record<string, string> = {
  pendente: "bg-amber-500/90",
  pago: "bg-emerald-500/90",
  cancelado: "bg-red-500/90",
  entregue: "bg-blue-500/90",
};

export default async function AdminDashboardPage() {
  const [stats, pedidosPorDia, ultimosPedidos] = await Promise.all([
    getDashboardStats(),
    getPedidosPorDia(),
    getUltimosPedidos(5),
  ]);

  return (
    <div className="min-h-screen bg-[#0f1115] text-zinc-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white">Início</h1>
          <p className="mt-2 text-zinc-400">
            Visão geral da loja, vendas e catálogo.
          </p>
        </header>

        {/* Linha de Destaque — Cards */}
        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
            <p className="text-sm font-medium text-zinc-400">Clientes</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats.clientesTotal}</p>
            <p className="mt-1 text-xs text-emerald-400">+{stats.clientesNovosMes} este mês</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
            <p className="text-sm font-medium text-zinc-400">Vendas Aprovadas</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats.vendasAprovadasCount} pedidos</p>
            <p className="mt-1 text-lg font-semibold text-emerald-400">
              {formatarPreco(stats.vendasAprovadasTotal)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
            <p className="text-sm font-medium text-zinc-400">Conversão</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats.canceladosCount}</p>
            <p className="mt-1 text-xs text-zinc-500">Cancelados (desistências)</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
            <p className="text-sm font-medium text-zinc-400">Site Views</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats.siteViews.toLocaleString("pt-BR")}</p>
            <p className="mt-1 text-xs text-zinc-500">Visualizações únicas</p>
          </div>
        </section>

        {/* Status do Catálogo */}
        <section className="mb-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
            <p className="text-sm font-medium text-zinc-400">Produtos</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats.produtosAtivos}</p>
            <p className="mt-1 text-xs text-zinc-500">Ativos no catálogo</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
            <p className="text-sm font-medium text-zinc-400">Promoções</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats.promocoesCount}</p>
            <p className="mt-1 text-xs text-zinc-500">Preço de venda &lt; original</p>
          </div>
        </section>

        {/* Gráfico + Últimos Pedidos */}
        <section className="grid gap-8 lg:grid-cols-5">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg lg:col-span-3">
            <h2 className="mb-4 text-lg font-semibold text-white">Pedidos nos últimos 7 dias</h2>
            <GraficoPedidos dados={pedidosPorDia} />
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Últimos 5 pedidos</h2>
              <Link
                href="/admin/pedidos"
                className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                Ver todos
              </Link>
            </div>
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/50">
                    <th className="px-3 py-2.5 font-medium text-zinc-400">#</th>
                    <th className="px-3 py-2.5 font-medium text-zinc-400">Cliente</th>
                    <th className="px-3 py-2.5 font-medium text-zinc-400">Valor</th>
                    <th className="px-3 py-2.5 font-medium text-zinc-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosPedidos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-zinc-500">
                        Nenhum pedido ainda.
                      </td>
                    </tr>
                  ) : (
                    ultimosPedidos.map((p) => (
                      <tr key={p.id} className="border-b border-zinc-800/80 last:border-0">
                        <td className="px-3 py-2.5 font-medium text-white">
                          <Link href={`/admin/pedidos/${p.id}`} className="hover:underline">
                            {p.numero}
                          </Link>
                        </td>
                        <td className="max-w-[120px] truncate px-3 py-2.5 text-zinc-300" title={p.cliente_nome}>
                          {p.cliente_nome}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-white">{formatarPreco(p.total)}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-xs font-medium text-white ${SITUACAO_COR[p.situacao] ?? "bg-zinc-600"}`}
                          >
                            {SITUACAO_LABEL[p.situacao] ?? p.situacao}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
