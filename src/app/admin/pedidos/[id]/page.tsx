import Link from "next/link";
import { notFound } from "next/navigation";
import { getPedidoPorId } from "@/lib/pedidos";
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
  rejeitado: "Rejeitado",
};

export default async function DetalhePedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pedido = await getPedidoPorId(id);
  if (!pedido) notFound();

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
          {pedido.payment_id && (
            <p className="mt-1 text-xs text-zinc-500">
              Payment ID (MP): <span className="font-mono text-zinc-400">{pedido.payment_id}</span>
              {" — use no painel do Mercado Pago em \"Avaliar qualidade\" se solicitado."}
            </p>
          )}
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-500">Itens</h2>
          <ul className="mt-2 space-y-2">
            {pedido.itens.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-zinc-300">
                  {item.produto_nome} × {item.quantidade}
                </span>
                <span className="text-white">{formatarPreco(item.preco_unitario * item.quantidade)}</span>
              </li>
            ))}
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
                    <p className="mt-1 text-zinc-400">E-mail: {item.conta.email_conta ?? "-"}</p>
                    <p className="text-zinc-400">Senha: {item.conta.senha_conta ?? "-"}</p>
                    {item.conta.dados_extras && (
                      <p className="mt-1 text-zinc-400">{item.conta.dados_extras}</p>
                    )}
                  </li>
                ) : (
                  <li key={item.id} className="text-zinc-500">{item.produto_nome} — conta não atribuída</li>
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
