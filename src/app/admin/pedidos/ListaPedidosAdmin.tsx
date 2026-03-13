"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  cancelarPedido,
  reenviarEmailEntrega,
  marcarComoEntregue,
  atribuirContasEPrepararEntrega,
} from "./actions";
import type { PedidoComItens } from "@/lib/pedidos";
import type { SituacaoPedido } from "@/lib/pedidos";
import type { FormaPagamento } from "@/lib/pedidos";

type Props = {
  pedidos: PedidoComItens[];
  total: number;
  paginas: number;
  paginaAtual: number;
  filtroSituacao?: SituacaoPedido;
  filtroFormaPagamento?: FormaPagamento;
};

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

const SITUACAO_LABEL: Record<SituacaoPedido, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
  entregue: "Entregue",
  rejeitado: "Rejeitado",
};

const SITUACAO_COR: Record<SituacaoPedido, string> = {
  pendente: "bg-amber-500",
  pago: "bg-emerald-500",
  cancelado: "bg-red-500",
  entregue: "bg-blue-500",
  rejeitado: "bg-red-600",
};

export function ListaPedidosAdmin({
  pedidos,
  total,
  paginas,
  paginaAtual,
  filtroSituacao,
  filtroFormaPagamento,
}: Props) {
  const router = useRouter();
  const [acaoId, setAcaoId] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  function buildUrl(updates: { situacao?: string; forma_pagamento?: string; pagina?: number }) {
    const p = new URLSearchParams();
    if (updates.situacao ?? filtroSituacao) p.set("situacao", (updates.situacao ?? filtroSituacao)!);
    if (updates.forma_pagamento ?? filtroFormaPagamento)
      p.set("forma_pagamento", (updates.forma_pagamento ?? filtroFormaPagamento)!);
    if (updates.pagina !== undefined) p.set("pagina", String(updates.pagina));
    const q = p.toString();
    return q ? `/admin/pedidos?${q}` : "/admin/pedidos";
  }

  async function handleCancelar(id: string) {
    if (!confirm("Cancelar este pedido?")) return;
    setAcaoId(id);
    setMensagem(null);
    const res = await cancelarPedido(id);
    setAcaoId(null);
    setMenuAberto(null);
    if (res.ok) {
      router.refresh();
      setMensagem({ tipo: "ok", texto: "Pedido cancelado." });
    } else setMensagem({ tipo: "erro", texto: res.erro ?? "Erro." });
  }

  async function handleReenviarEmail(id: string) {
    setAcaoId(id);
    setMensagem(null);
    const res = await reenviarEmailEntrega(id);
    setAcaoId(null);
    setMenuAberto(null);
    if (res.ok) {
      router.refresh();
      setMensagem({ tipo: "ok", texto: "E-mail reenviado." });
    } else setMensagem({ tipo: "erro", texto: res.erro ?? "Erro." });
  }

  async function handleMarcarEntregue(id: string) {
    setAcaoId(id);
    setMensagem(null);
    const res = await marcarComoEntregue(id);
    setAcaoId(null);
    setMenuAberto(null);
    if (res.ok) {
      router.refresh();
      setMensagem({ tipo: "ok", texto: "Marcado como entregue." });
    } else setMensagem({ tipo: "erro", texto: res.erro ?? "Erro." });
  }

  async function handleAtribuirContas(id: string) {
    setAcaoId(id);
    setMensagem(null);
    const res = await atribuirContasEPrepararEntrega(id);
    setAcaoId(null);
    setMenuAberto(null);
    if (res.ok) {
      router.refresh();
      setMensagem({ tipo: "ok", texto: "Contas atribuídas e e-mail enviado." });
    } else setMensagem({ tipo: "erro", texto: res.erro ?? "Erro." });
  }

  return (
    <>
      {mensagem && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 ${
            mensagem.tipo === "ok"
              ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-200"
              : "border-red-900/50 bg-red-950/30 text-red-200"
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <span className="text-sm text-zinc-500">
          Situação:
        </span>
        {(["pendente", "pago", "cancelado", "entregue"] as SituacaoPedido[]).map((s) => (
          <Link
            key={s}
            href={buildUrl({ situacao: filtroSituacao === s ? undefined : s, pagina: 1 })}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              filtroSituacao === s
                ? "bg-zinc-700 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {SITUACAO_LABEL[s]}
          </Link>
        ))}
        <span className="ml-4 text-sm text-zinc-500">Pagamento:</span>
        <Link
          href={buildUrl({
            forma_pagamento: filtroFormaPagamento === "mercado_pago" ? undefined : "mercado_pago",
            pagina: 1,
          })}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            filtroFormaPagamento === "mercado_pago" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          Mercado Pago
        </Link>
        <Link
          href={buildUrl({
            forma_pagamento: filtroFormaPagamento === "pix" ? undefined : "pix",
            pagina: 1,
          })}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            filtroFormaPagamento === "pix" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          Pix
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-zinc-500">
        <span>Mostrando {pedidos.length} de {total} no total</span>
        <span>
          {paginaAtual} / {Math.max(1, paginas)}
          {paginaAtual > 1 && (
            <Link href={buildUrl({ pagina: paginaAtual - 1 })} className="ml-2 text-white hover:underline">
              ←
            </Link>
          )}
          {paginaAtual < paginas && (
            <Link href={buildUrl({ pagina: paginaAtual + 1 })} className="ml-2 text-white hover:underline">
              →
            </Link>
          )}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-zinc-400">
              <th className="p-4 font-medium">#</th>
              <th className="p-4 font-medium">Situação</th>
              <th className="p-4 font-medium">Data</th>
              <th className="p-4 font-medium">Cliente</th>
              <th className="p-4 font-medium">Pagamento</th>
              <th className="p-4 font-medium">Envio</th>
              <th className="p-4 font-medium">Total</th>
              <th className="p-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            ) : (
              pedidos.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)]/80 hover:bg-zinc-800/30">
                  <td className="p-4 font-medium text-white">{p.numero}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${SITUACAO_COR[p.situacao]} bg-opacity-20 text-white`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${SITUACAO_COR[p.situacao]}`} />
                      {SITUACAO_LABEL[p.situacao]}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-300">{formatarData(p.created_at)}</td>
                  <td className="p-4 text-zinc-300">{p.cliente_nome}</td>
                  <td className="p-4">
                    <span className={p.forma_pagamento === "pix" ? "text-emerald-400" : "text-blue-400"}>
                      {p.forma_pagamento === "pix" ? "Pix" : "Mercado Pago"}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-500">Recebimento por e-mail</td>
                  <td className="p-4 font-medium text-white">{formatarPreco(p.total)}</td>
                  <td className="p-4">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuAberto(menuAberto === p.id ? null : p.id)}
                        className="rounded p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                        aria-label="Ações"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      {menuAberto === p.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(null)} />
                          <div className="absolute right-0 top-full z-20 mt-1 min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-xl">
                            <Link
                              href={`/admin/pedidos/${p.id}`}
                              className="block px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                              onClick={() => setMenuAberto(null)}
                            >
                              Ver detalhes
                            </Link>
                            {p.situacao === "pago" && (
                              <button
                                type="button"
                                onClick={() => handleAtribuirContas(p.id)}
                                disabled={!!acaoId}
                                className="w-full px-4 py-2 text-left text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                              >
                                Atribuir contas e enviar e-mail
                              </button>
                            )}
                            {(p.situacao === "entregue" || p.email_enviado_em) && (
                              <button
                                type="button"
                                onClick={() => handleReenviarEmail(p.id)}
                                disabled={!!acaoId}
                                className="w-full px-4 py-2 text-left text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                              >
                                Reenviar e-mail de entrega
                              </button>
                            )}
                            {p.situacao === "pago" && (
                              <button
                                type="button"
                                onClick={() => handleMarcarEntregue(p.id)}
                                disabled={!!acaoId}
                                className="w-full px-4 py-2 text-left text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                              >
                                Marcar como entregue
                              </button>
                            )}
                            {p.situacao !== "cancelado" && (
                              <button
                                type="button"
                                onClick={() => handleCancelar(p.id)}
                                disabled={!!acaoId}
                                className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-950/30 disabled:opacity-50"
                              >
                                Cancelar pedido
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
