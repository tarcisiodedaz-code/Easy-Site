import Link from "next/link";
import { notFound } from "next/navigation";
import { getPedidoPorId } from "@/lib/pedidos";
import { createAdminClient } from "@/lib/supabase-admin";
import { AcoesPedidoDetalhe } from "./AcoesPedidoDetalhe";

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarPreco(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

const SITUACAO_LABEL: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
  entregue: "Entregue",
};

export default async function DetalhePedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pedido = await getPedidoPorId(id);
  if (!pedido) notFound();

  const produtoIds = [...new Set(pedido.itens.map((i) => i.produto_id).filter(Boolean))];
  let origemPorProdutoId: Record<string, "estoque" | "playstation"> = {};
  if (produtoIds.length > 0) {
    const supabase = createAdminClient();
    const { data: prods } = await supabase
      .from("produtos_loja")
      .select("id, id_externo, url_origem")
      .in("id", produtoIds);
    for (const row of prods ?? []) {
      const r = row as { id: string; id_externo?: string | null; url_origem?: string | null };
      if (r.id_externo?.startsWith("estoque-")) origemPorProdutoId[r.id] = "estoque";
      else if (r.url_origem?.toLowerCase().includes("playstation")) origemPorProdutoId[r.id] = "playstation";
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin/pedidos" className="mb-8 inline-block text-sm text-zinc-400 hover:text-white">
        ← Pedidos
      </Link>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedido #{pedido.numero}</h1>
          <p className="mt-1 text-zinc-400">
            {formatarData(pedido.created_at)} · {SITUACAO_LABEL[pedido.situacao] ?? pedido.situacao}
          </p>
        </div>
        <AcoesPedidoDetalhe pedido={pedido} />
      </div>

      <div className="mt-8 space-y-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div>
          <h2 className="text-sm font-medium text-zinc-500">Cliente</h2>
          <p className="mt-1 text-white">{pedido.cliente_nome}</p>
          <p className="text-zinc-400">{pedido.cliente_email}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-500">Pagamento</h2>
          <p className="mt-1 text-white">{pedido.forma_pagamento === "pix" ? "Pix" : "Mercado Pago"}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-500">Itens</h2>
          <ul className="mt-2 space-y-2">
            {pedido.itens.map((item) => {
              const origem = origemPorProdutoId[item.produto_id];
              return (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm">
                  <span className="text-zinc-300">
                    {item.produto_nome} × {item.quantidade}
                    {origem && (
                      <span
                        className={`ml-2 inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${
                          origem === "estoque" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {origem === "estoque" ? "Estoque" : "PlayStation"}
                      </span>
                    )}
                  </span>
                  <span className="text-white">{formatarPreco(item.preco_unitario * item.quantidade)}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 font-semibold text-white">Total: {formatarPreco(pedido.total)}</p>
        </div>
        {pedido.itens.some((i) => i.conta) && (
          <div>
            <h2 className="text-sm font-medium text-zinc-500">Dados de entrega (contas)</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {pedido.itens.map((item) =>
                item.conta ? (
                  <li key={item.id} className="rounded bg-zinc-800/50 p-3">
                    <span className="font-medium text-white">{item.produto_nome}</span>
                    {origemPorProdutoId[item.produto_id] && (
                      <span
                        className={`ml-2 inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${
                          origemPorProdutoId[item.produto_id] === "estoque"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {origemPorProdutoId[item.produto_id] === "estoque" ? "Estoque" : "PlayStation"}
                      </span>
                    )}
                    <p className="mt-1 text-zinc-400">E-mail: {item.conta.email_conta ?? "-"}</p>
                    <p className="text-zinc-400">Senha: {item.conta.senha_conta ?? "-"}</p>
                    {item.conta.dados_extras && (
                      <p className="mt-1 text-zinc-400">{item.conta.dados_extras}</p>
                    )}
                  </li>
                ) : (
                  <li key={item.id} className="text-zinc-500">
                    {item.produto_nome}
                    {origemPorProdutoId[item.produto_id] && (
                      <span
                        className={`ml-2 inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${
                          origemPorProdutoId[item.produto_id] === "estoque"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {origemPorProdutoId[item.produto_id] === "estoque" ? "Estoque" : "PlayStation"}
                      </span>
                    )}
                    {" — conta não atribuída"}
                  </li>
                )
              )}
            </ul>
          </div>
        )}
        {pedido.email_enviado_em && (
          <p className="text-sm text-zinc-500">E-mail enviado em {formatarData(pedido.email_enviado_em)}</p>
        )}
      </div>
    </div>
  );
}
