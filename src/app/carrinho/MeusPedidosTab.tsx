"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getImagemAltaResolucao } from "@/lib/imagem-playstation";
import { formatBRL } from "@/lib/utils/formatters";

type ContaEntrega = {
  email_conta?: string;
  senha_conta?: string;
  dados_extras?: string;
};

type PedidoItem = {
  id: string;
  produto_id: string;
  produto_nome: string;
  preco_unitario: number;
  quantidade: number;
  conta_entrega_id?: string;
  contas_entrega?: ContaEntrega;
};

type Pedido = {
  id: string;
  numero: number;
  total: number;
  situacao: string;
  forma_pagamento: string;
  created_at: string;
  pedido_itens: PedidoItem[];
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<string, { label: string; cor: string; icon: string }> = {
  pendente: { label: "Pendente", cor: "text-amber-400", icon: "⏳" },
  pago: { label: "Pago", cor: "text-emerald-400", icon: "✅" },
  entregue: { label: "Entregue", cor: "text-blue-400", icon: "📦" },
  cancelado: { label: "Cancelado", cor: "text-red-400", icon: "❌" },
  rejeitado: { label: "Rejeitado", cor: "text-red-400", icon: "❌" },
};

function PedidoCard({ pedido, expandido, onToggle }: { pedido: Pedido; expandido: boolean; onToggle: () => void }) {
  const status = STATUS_CONFIG[pedido.situacao] ?? STATUS_CONFIG.pendente;
  const formaPgto = pedido.forma_pagamento === "pix" ? "PIX" : "Cartão";

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 overflow-hidden">
      {/* Header do pedido - sempre visível */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-700/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-white">Pedido #{pedido.numero}</span>
            <span className={`text-sm ${status.cor}`}>
              {status.icon} {status.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {formatarData(pedido.created_at)} • {formaPgto} • {formatBRL(pedido.total)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {pedido.pedido_itens.length} {pedido.pedido_itens.length === 1 ? "item" : "itens"}
          </p>
        </div>
        <svg
          className={`h-5 w-5 text-zinc-400 transition-transform ${expandido ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Detalhes expandidos */}
      {expandido && (
        <div className="border-t border-zinc-700 p-4 space-y-4">
          {pedido.pedido_itens.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-zinc-700">
                <Image
                  src={getImagemAltaResolucao(`https://store.playstation.com/store/api/chihiro/00_09_000/container/BR/pt/${item.produto_id}/image`) || "/placeholder.png"}
                  alt={item.produto_nome}
                  fill
                  className="object-cover"
                  sizes="48px"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/produto/${item.produto_id}`}
                  className="font-medium text-white hover:text-emerald-400"
                >
                  {item.produto_nome}
                </Link>
                <p className="text-sm text-zinc-400">
                  {formatBRL(item.preco_unitario)} × {item.quantidade}
                </p>

                {/* Dados de entrega (se houver) */}
                {item.contas_entrega && (pedido.situacao === "pago" || pedido.situacao === "entregue") && (
                  <div className="mt-2 rounded-lg bg-emerald-950/30 border border-emerald-800/50 p-3">
                    <p className="text-xs font-medium text-emerald-400 mb-2">🎮 Dados de acesso:</p>
                    {item.contas_entrega.email_conta && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-zinc-400">Email:</span>
                        <code className="text-white bg-zinc-800 px-2 py-0.5 rounded">{item.contas_entrega.email_conta}</code>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(item.contas_entrega!.email_conta!)}
                          className="text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          Copiar
                        </button>
                      </div>
                    )}
                    {item.contas_entrega.senha_conta && (
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <span className="text-zinc-400">Senha:</span>
                        <code className="text-white bg-zinc-800 px-2 py-0.5 rounded">{item.contas_entrega.senha_conta}</code>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(item.contas_entrega!.senha_conta!)}
                          className="text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          Copiar
                        </button>
                      </div>
                    )}
                    {item.contas_entrega.dados_extras && (
                      <p className="text-sm text-zinc-300 mt-1">{item.contas_entrega.dados_extras}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="font-semibold text-emerald-400">
                  {formatBRL(item.preco_unitario * item.quantidade)}
                </span>
              </div>
            </div>
          ))}

          <div className="pt-3 border-t border-zinc-700 flex justify-between items-center">
            <span className="text-zinc-400">Total do pedido</span>
            <span className="text-lg font-bold text-white">{formatBRL(pedido.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function MeusPedidosTab() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/meus-pedidos")
      .then((r) => r.json())
      .then((data) => {
        if (data.erro && data.erro !== "Não autenticado") {
          setErro(data.erro);
        }
        setPedidos(data.pedidos ?? []);
      })
      .catch(() => setErro("Erro ao carregar pedidos"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-xl border border-red-800/50 bg-red-950/20 p-6 text-center">
        <p className="text-red-400">{erro}</p>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-12 text-center">
        <div className="text-4xl mb-4">📦</div>
        <p className="text-zinc-400">Você ainda não tem pedidos.</p>
        <p className="mt-1 text-sm text-zinc-500">
          Quando fizer uma compra, seus pedidos aparecerão aqui.
        </p>
        <Link
          href="/categorias/ofertas"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-500"
        >
          Ver ofertas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pedidos.map((pedido) => (
        <PedidoCard
          key={pedido.id}
          pedido={pedido}
          expandido={expandido === pedido.id}
          onToggle={() => setExpandido(expandido === pedido.id ? null : pedido.id)}
        />
      ))}
    </div>
  );
}
