"use server";

import { validateAdminSession } from "@/lib/auth-admin";
import {
  atualizarSituacaoPedido,
  marcarEmailEnviado,
  getPedidoPorId,
  buscarContaDisponivel,
  atribuirContaAoItem,
} from "@/lib/pedidos";
import { enviarEmailEntrega } from "@/lib/email-entrega";

export async function cancelarPedido(id: string) {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  const ok = await atualizarSituacaoPedido(id, "cancelado");
  return ok ? { ok: true } : { ok: false, erro: "Erro ao cancelar." };
}

export async function reenviarEmailEntrega(id: string) {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  const pedido = await getPedidoPorId(id);
  if (!pedido) return { ok: false, erro: "Pedido não encontrado." };
  const enviado = await enviarEmailEntrega(pedido);
  if (enviado) await marcarEmailEnviado(id);
  return enviado ? { ok: true } : { ok: false, erro: "Falha ao enviar e-mail." };
}

export async function marcarComoEntregue(id: string) {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  const ok = await marcarEmailEnviado(id);
  return ok ? { ok: true } : { ok: false, erro: "Erro ao atualizar." };
}

export async function atribuirContasEPrepararEntrega(pedidoId: string) {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  let pedido = await getPedidoPorId(pedidoId);
  if (!pedido) return { ok: false, erro: "Pedido não encontrado." };
  for (const item of pedido.itens) {
    if (item.conta_entrega_id) continue;
    const conta = await buscarContaDisponivel(item.produto_id);
    if (conta) await atribuirContaAoItem(item.id, conta.id);
  }
  pedido = await getPedidoPorId(pedidoId);
  const enviado = pedido ? await enviarEmailEntrega(pedido) : false;
  if (enviado) await marcarEmailEnviado(pedidoId);
  return { ok: true };
}
