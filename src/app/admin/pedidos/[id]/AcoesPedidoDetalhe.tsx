"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  cancelarPedido,
  reenviarEmailEntrega,
  marcarComoEntregue,
  atribuirContasEPrepararEntrega,
} from "../actions";
import type { PedidoComItens } from "@/lib/pedidos";

export function AcoesPedidoDetalhe({ pedido }: { pedido: PedidoComItens }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(
    fn: () => Promise<{ ok: boolean; erro?: string }>,
    successMsg: string
  ) {
    setLoading(true);
    setMsg(null);
    const res = await fn();
    setLoading(false);
    if (res.ok) {
      setMsg(successMsg);
      router.refresh();
    } else setMsg(res.erro ?? "Erro.");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {msg && (
        <p className={`w-full text-sm ${msg.includes("Erro") ? "text-red-400" : "text-emerald-400"}`}>
          {msg}
        </p>
      )}
      {pedido.situacao === "pago" && (
        <button
          type="button"
          onClick={() => run(() => atribuirContasEPrepararEntrega(pedido.id), "Contas atribuídas e e-mail enviado.")}
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          Atribuir contas e enviar e-mail
        </button>
      )}
      {(pedido.situacao === "entregue" || pedido.email_enviado_em) && (
        <button
          type="button"
          onClick={() => run(() => reenviarEmailEntrega(pedido.id), "E-mail reenviado.")}
          disabled={loading}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Reenviar e-mail
        </button>
      )}
      {pedido.situacao === "pago" && (
        <button
          type="button"
          onClick={() => run(() => marcarComoEntregue(pedido.id), "Marcado como entregue.")}
          disabled={loading}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Marcar como entregue
        </button>
      )}
      {pedido.situacao !== "cancelado" && (
        <button
          type="button"
          onClick={() => {
            if (confirm("Cancelar este pedido?")) run(() => cancelarPedido(pedido.id), "Pedido cancelado.");
          }}
          disabled={loading}
          className="rounded-lg border border-red-900/50 px-4 py-2 text-sm text-red-400 hover:bg-red-950/30"
        >
          Cancelar pedido
        </button>
      )}
    </div>
  );
}
