import Link from "next/link";
import {
  getDashboardStats,
  getPedidosPorDia,
  getUltimosPedidos,
  getVendasELucro,
  getJogosMaisVendidos,
  getMaisTempoEstoqueSemVender,
} from "@/lib/dashboard";
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
  const [
    stats,
    pedidosPorDia,
    ultimosPedidos,
    vendasELucro,
    jogosMaisVendidos,
    estoqueSemVenda,
  ] = await Promise.all([
    getDashboardStats(),
    getPedidosPorDia(),
    getUltimosPedidos(5),
    getVendasELucro(),
    getJogosMaisVendidos(10),
    getMaisTempoEstoqueSemVender(10),
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

        {/* Vendas — Valor bruto e Lucro */}
        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
            <p className="text-sm font-medium text-zinc-400">Valor bruto das vendas</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatarPreco(vendasELucro.valorBruto)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{stats.vendasAprovadasCount} pedidos (pago + entregue)</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
            <p className="text-sm font-medium text-zinc-400">Lucro</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">
              {formatarPreco(vendasELucro.lucroTotal)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Receita − custo dos itens vendidos</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
            <p className="text-sm font-medium text-zinc-400">Clientes</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats.clientesTotal}</p>
            <p className="mt-1 text-xs text-emerald-400">+{stats.clientesNovosMes} este mês</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
            <p className="text-sm font-medium text-zinc-400">Cancelados</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats.canceladosCount}</p>
            <p className="mt-1 text-xs text-zinc-500">Desistências</p>
          </div>
        </section>

        {/* Catálogo e Site */}
        <section className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
            <p className="text-sm font-medium text-zinc-400">Produtos ativos</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats.produtosAtivos}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
            <p className="text-sm font-medium text-zinc-400">Promoções</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats.promocoesCount}</p>
            <p className="mt-1 text-xs text-zinc-500">Preço &lt; original</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
            <p className="text-sm font-medium text-zinc-400">Site Views</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats.siteViews.toLocaleString("pt-BR")}</p>
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

        {/* Jogos que mais vendeu */}
        <section className="mb-10 grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Jogos que mais vendeu</h2>
              <Link
                href="/admin/pedidos"
                className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                Ver pedidos
              </Link>
            </div>
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/50">
                    <th className="px-3 py-2.5 font-medium text-zinc-400">#</th>
                    <th className="px-3 py-2.5 font-medium text-zinc-400">Jogo</th>
                    <th className="px-3 py-2.5 text-right font-medium text-zinc-400">Qtd vendida</th>
                  </tr>
                </thead>
                <tbody>
                  {jogosMaisVendidos.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-zinc-500">
                        Nenhuma venda ainda.
                      </td>
                    </tr>
                  ) : (
                    jogosMaisVendidos.map((j, i) => (
                      <tr key={j.produto_id} className="border-b border-zinc-800/80 last:border-0">
                        <td className="px-3 py-2.5 font-medium text-zinc-500">{i + 1}</td>
                        <td className="max-w-[200px] truncate px-3 py-2.5 text-white" title={j.nome}>
                          <Link
                            href={`/admin/produtos/${j.produto_id}/editar`}
                            className="hover:underline hover:text-emerald-400"
                          >
                            {j.nome}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-emerald-400">
                          {j.quantidade}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Mais tempo no estoque sem vender</h2>
              <Link
                href="/admin/produtos"
                className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                Ver produtos
              </Link>
            </div>
            <p className="mb-3 text-xs text-zinc-500">
              Produtos com estoque que nunca venderam ou estão há mais tempo sem venda.
            </p>
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/50">
                    <th className="px-3 py-2.5 font-medium text-zinc-400">Jogo</th>
                    <th className="px-3 py-2.5 text-right font-medium text-zinc-400">Estoque</th>
                    <th className="px-3 py-2.5 text-right font-medium text-zinc-400">Dias sem vender</th>
                  </tr>
                </thead>
                <tbody>
                  {estoqueSemVenda.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-zinc-500">
                        Nenhum produto com estoque gerenciado.
                      </td>
                    </tr>
                  ) : (
                    estoqueSemVenda.map((e) => (
                      <tr key={e.produto_id} className="border-b border-zinc-800/80 last:border-0">
                        <td className="max-w-[200px] truncate px-3 py-2.5 text-white" title={e.nome}>
                          <Link
                            href={`/admin/produtos/${e.produto_id}/editar`}
                            className="hover:underline hover:text-emerald-400"
                          >
                            {e.nome}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-right text-zinc-300">
                          {e.quantidade_estoque}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {e.dias_sem_vender == null ? (
                            <span className="text-amber-400">Nunca vendeu</span>
                          ) : (
                            <span className="text-zinc-400">{e.dias_sem_vender} dias</span>
                          )}
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
