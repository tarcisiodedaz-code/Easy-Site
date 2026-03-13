/**
 * Integração Mercado Pago no servidor (Checkout Transparente).
 * Usar apenas em API Routes ou Server Actions; nunca expor Access Token.
 */

import { getLojaConfig } from "./loja-config";
import type { MercadoPagoConfig } from "@/types/loja-config";

const MP_API = "https://api.mercadopago.com";

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

type CriarPagamentoPixParams = {
  transaction_amount: number;
  payer_email: string;
  description: string;
  pedido_id: string;
};

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
    const res = await fetch(`${MP_API}/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Idempotency-Key": gerarIdempotencyKey(),
      },
      body: JSON.stringify({
        transaction_amount: params.transaction_amount,
        payment_method_id: "pix",
        payer: { email: params.payer_email },
        description: params.description,
        metadata: { pedido_id: params.pedido_id },
      }),
    });
    const data = await res.json();
    if (data.id) {
      const poi = data.point_of_interaction?.transaction_data ?? {};
      return {
        ok: true,
        payment_id: String(data.id),
        qr_code_base64: poi.qr_code_base64 ?? undefined,
        qr_code: poi.qr_code ?? undefined,
        ticket_url: poi.ticket_url ?? undefined,
      };
    }
    return {
      ok: false,
      erro: data.message || data.error || `Erro ${res.status}`,
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
  description: string;
  pedido_id: string;
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
    const res = await fetch(`${MP_API}/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Idempotency-Key": gerarIdempotencyKey(),
      },
      body: JSON.stringify({
        transaction_amount: params.transaction_amount,
        payment_method_id: "credit_card",
        token: params.token,
        installments: params.installments,
        payer: {
          email: params.payer_email,
          first_name: params.payer_nome.split(/\s+/)[0] || params.payer_nome,
          last_name: params.payer_nome.split(/\s+/).slice(1).join(" ") || ".",
        },
        description: params.description,
        metadata: { pedido_id: params.pedido_id },
      }),
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

/** Consulta status de um pagamento no MP. */
export async function consultarPagamento(paymentId: string): Promise<{ status?: string; erro?: string }> {
  const token = await getAccessTokenForPayment();
  if (!token) return { erro: "Mercado Pago não configurado." };
  try {
    const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.status) return { status: data.status };
    return { erro: data.message || `Erro ${res.status}` };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Erro ao consultar pagamento." };
  }
}
