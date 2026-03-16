/**
 * Integração Mercado Pago no servidor (Checkout Transparente).
 * Usar apenas em API Routes ou Server Actions; nunca expor Access Token.
 */

import { getLojaConfig } from "./loja-config";
import type { MercadoPagoConfig } from "@/types/loja-config";

const MP_API = "https://api.mercadopago.com";

/** URL base do site (para notification_url do webhook). Configure NEXT_PUBLIC_SITE_URL na Vercel. */
function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  return "https://easygames.store";
}

/** Gera um ID único para o header X-Idempotency-Key */
function gerarIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export async function getMercadoPagoConfig(): Promise<MercadoPagoConfig> {
  return getLojaConfig("mercado_pago");
}

/** Retorna apenas dados seguros para o frontend (Public Key + sandbox). */
export async function getMercadoPagoConfigPublic(): Promise<{
  publicKey: string;
  sandbox: boolean;
}> {
  const config = await getMercadoPagoConfig();
  if (!config?.publicKey) {
    return { publicKey: "", sandbox: true };
  }
  return {
    publicKey: config.publicKey.trim(),
    sandbox: config.sandbox === true,
  };
}

function getAccessToken(): string | null {
  return process.env.MERCADOPAGO_ACCESS_TOKEN ?? null;
}

/** Access Token: prioridade loja_config, depois env. */
export async function getAccessTokenForPayment(): Promise<string | null> {
  const config = await getMercadoPagoConfig();
  if (config?.accessToken?.trim()) return config.accessToken.trim();
  return getAccessToken();
}

/** Testa conexão com a API do MP (para o botão "Testar conexão" no admin). */
export async function testarConexaoMercadoPago(): Promise<{ ok: boolean; mensagem: string }> {
  const token = await getAccessTokenForPayment();
  if (!token) {
    return {
      ok: false,
      mensagem: "Access Token não configurado. Preencha o campo «Access Token» nesta página e clique em «Salvar» antes de testar.",
    };
  }
  try {
    // Endpoint que existe na API de Pagamentos e exige Access Token
    const res = await fetch(`${MP_API}/v1/payment_methods`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) return { ok: true, mensagem: "Conexão com Mercado Pago OK." };
    const err = await res.text();
    return { ok: false, mensagem: res.status === 401 ? "Access Token inválido." : err || `Erro ${res.status}` };
  } catch (e) {
    return {
      ok: false,
      mensagem: e instanceof Error ? e.message : "Erro ao conectar com Mercado Pago.",
    };
  }
}

/** Item para additional_info.items (melhora aprovação e conciliação no MP). */
export type MercadoPagoItem = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  category_id?: string;
  description?: string;
};

type CriarPagamentoPixParams = {
  transaction_amount: number;
  payer_email: string;
  payer_nome?: string | null;
  payer_cpf?: string | null;
  description: string;
  pedido_id: string;
  /** Itens do pedido (recomendado pelo MP para aprovação e conciliação). */
  items?: MercadoPagoItem[];
};

/** Monta mensagem de erro a partir da resposta da API do Mercado Pago. */
function extrairErroMp(data: Record<string, unknown>, status: number): string {
  const msg = data.message ?? data.error;
  if (typeof msg === "string" && msg.trim()) return msg.trim();
  const cause = data.cause as Array<{ description?: string }> | undefined;
  if (Array.isArray(cause) && cause[0]?.description) return cause[0].description;
  const statusDetail = data.status_detail;
  if (typeof statusDetail === "string" && statusDetail.trim()) return statusDetail.trim();
  return `Erro ${status}`;
}

/** Cria um pagamento PIX no Mercado Pago. */
export async function criarPagamentoPix(
  params: CriarPagamentoPixParams
): Promise<{
  ok: boolean;
  payment_id?: string;
  qr_code_base64?: string;
  qr_code?: string;
  ticket_url?: string;
  erro?: string;
}> {
  const token = await getAccessTokenForPayment();
  if (!token) {
    return { ok: false, erro: "Mercado Pago não configurado." };
  }
  try {
    const nome = params.payer_nome?.trim() || "";
    const cpf = params.payer_cpf != null ? String(params.payer_cpf).replace(/\D/g, "").slice(0, 11) : "";
    const payer: Record<string, unknown> = {
      email: params.payer_email,
      ...(nome ? { first_name: nome.split(/\s+/)[0] || nome, last_name: nome.split(/\s+/).slice(1).join(" ") || "." } : {}),
      ...(cpf.length === 11 ? { identification: { type: "CPF", number: cpf } } : {}),
    };
    const body: Record<string, unknown> = {
      transaction_amount: params.transaction_amount,
      payment_method_id: "pix",
      payer,
      description: params.description,
      metadata: { pedido_id: params.pedido_id },
      notification_url: `${getBaseUrl()}/api/webhooks/mercado-pago`,
      external_reference: params.pedido_id,
    };
    if (params.items?.length) {
      body.additional_info = {
        items: params.items.map((i) => ({
          id: i.id,
          title: i.title.slice(0, 256),
          quantity: i.quantity,
          unit_price: i.unit_price,
          ...(i.category_id ? { category_id: i.category_id } : {}),
          ...(i.description ? { description: i.description.slice(0, 256) } : {}),
        })),
      };
    }
    const res = await fetch(`${MP_API}/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Idempotency-Key": gerarIdempotencyKey(),
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (data.id) {
      const poi = (data.point_of_interaction as Record<string, unknown>)?.transaction_data as Record<string, unknown> | undefined;
      const poiSafe = poi ?? {};
      return {
        ok: true,
        payment_id: String(data.id),
        qr_code_base64: (poiSafe.qr_code_base64 as string) ?? undefined,
        qr_code: (poiSafe.qr_code as string) ?? undefined,
        ticket_url: (poiSafe.ticket_url as string) ?? undefined,
      };
    }
    return {
      ok: false,
      erro: extrairErroMp(data, res.status),
    };
  } catch (e) {
    return {
      ok: false,
      erro: e instanceof Error ? e.message : "Erro ao criar pagamento PIX.",
    };
  }
}

type CriarPagamentoCartaoParams = {
  transaction_amount: number;
  token: string;
  installments: number;
  payer_email: string;
  payer_nome: string;
  payer_cpf?: string | null;
  description: string;
  pedido_id: string;
  /** Itens do pedido (recomendado pelo MP para aprovação e conciliação). */
  items?: MercadoPagoItem[];
  /** Nome que aparece na fatura do cartão (até 22 caracteres). */
  statement_descriptor?: string;
};

/** Cria um pagamento com cartão de crédito no Mercado Pago. */
export async function criarPagamentoCartao(
  params: CriarPagamentoCartaoParams
): Promise<{
  ok: boolean;
  payment_id?: string;
  status?: string;
  status_detail?: string;
  erro?: string;
}> {
  const token = await getAccessTokenForPayment();
  if (!token) {
    return { ok: false, erro: "Mercado Pago não configurado." };
  }
  try {
    const body: Record<string, unknown> = {
      transaction_amount: params.transaction_amount,
      token: params.token,
      installments: params.installments,
      payer: {
        email: params.payer_email,
        first_name: params.payer_nome.split(/\s+/)[0] || params.payer_nome,
        last_name: params.payer_nome.split(/\s+/).slice(1).join(" ") || ".",
        ...(params.payer_cpf
          ? {
              identification: {
                type: "CPF",
                number: String(params.payer_cpf).replace(/\D/g, "").slice(0, 11),
              },
            }
          : {}),
      },
      description: params.description,
      metadata: { pedido_id: params.pedido_id },
      notification_url: `${getBaseUrl()}/api/webhooks/mercado-pago`,
      external_reference: params.pedido_id,
      ...(params.statement_descriptor
        ? { statement_descriptor: params.statement_descriptor.slice(0, 22) }
        : {}),
    };
    if (params.items?.length) {
      body.additional_info = {
        items: params.items.map((i) => ({
          id: i.id,
          title: i.title.slice(0, 256),
          quantity: i.quantity,
          unit_price: i.unit_price,
          ...(i.category_id ? { category_id: i.category_id } : {}),
          ...(i.description ? { description: i.description.slice(0, 256) } : {}),
        })),
      };
    }
    const res = await fetch(`${MP_API}/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Idempotency-Key": gerarIdempotencyKey(),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.id) {
      return {
        ok: true,
        payment_id: String(data.id),
        status: data.status,
        status_detail: data.status_detail,
      };
    }
    return {
      ok: false,
      erro: data.message || data.cause?.[0]?.description || data.error || `Erro ${res.status}`,
    };
  } catch (e) {
    return {
      ok: false,
      erro: e instanceof Error ? e.message : "Erro ao processar cartão.",
    };
  }
}

/** Consulta status de um pagamento no MP. Retorna status e status_detail (motivo de rejeição, etc.). */
export async function consultarPagamento(
  paymentId: string
): Promise<{ status?: string; status_detail?: string; erro?: string }> {
  const token = await getAccessTokenForPayment();
  if (!token) return { erro: "Mercado Pago não configurado." };
  try {
    const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (data.status) {
      return {
        status: data.status as string,
        status_detail: typeof data.status_detail === "string" ? data.status_detail : undefined,
      };
    }
    return { erro: (data.message as string) || `Erro ${res.status}` };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Erro ao consultar pagamento." };
  }
}
