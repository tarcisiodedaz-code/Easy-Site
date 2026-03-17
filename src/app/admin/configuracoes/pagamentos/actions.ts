"use server";

import { validateAdminSession } from "@/lib/auth-admin";
import { getLojaConfig, setLojaConfig } from "@/lib/loja-config";
import { testarConexaoMercadoPago } from "@/lib/mercado-pago";
import type { MercadoPagoConfig, PagBankConfig } from "@/types/loja-config";

function baseUrlPagBank(sandbox: boolean): string {
  return sandbox ? "https://sandbox.api.pagseguro.com" : "https://api.pagseguro.com";
}

export async function salvarConfigMercadoPago(data: {
  publicKey: string;
  accessToken: string;
  sandbox: boolean;
  taxaCartao: number;
}): Promise<{ ok: boolean; erro?: string }> {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };
  const config: MercadoPagoConfig = {
    publicKey: data.publicKey?.trim() ?? "",
    accessToken: data.accessToken?.trim() ?? "",
    sandbox: data.sandbox === true,
    taxaCartao: data.taxaCartao ?? 5,
  };
  const r = await setLojaConfig("mercado_pago", config);
  return r.ok ? { ok: true } : { ok: false, erro: r.error ?? "Erro ao salvar" };
}

export async function testarConexao(): Promise<{ ok: boolean; mensagem: string }> {
  if (!(await validateAdminSession())) return { ok: false, mensagem: "Não autorizado." };
  return testarConexaoMercadoPago();
}

export async function salvarConfigPagBank(data: {
  token: string;
  sandbox: boolean;
  installments_limit: number;
  interest_free_installments: number;
  soft_descriptor: string;
}): Promise<{ ok: boolean; erro?: string }> {
  if (!(await validateAdminSession())) return { ok: false, erro: "Não autorizado." };

  const config: PagBankConfig = {
    token: data.token?.trim() ?? "",
    sandbox: data.sandbox === true,
    installments_limit: Math.max(1, Math.min(12, Number(data.installments_limit) || 12)),
    interest_free_installments: Math.max(0, Math.min(12, Number(data.interest_free_installments) || 0)),
    soft_descriptor: (data.soft_descriptor?.trim() || "EASYGAMES").slice(0, 17),
  };

  const r = await setLojaConfig("pagbank", config);
  return r.ok ? { ok: true } : { ok: false, erro: r.error ?? "Erro ao salvar" };
}

export async function testarConexaoPagBank(): Promise<{ ok: boolean; mensagem: string }> {
  if (!(await validateAdminSession())) return { ok: false, mensagem: "Não autorizado." };
  const cfg = await getLojaConfig("pagbank");
  const token = (cfg?.token?.trim() ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { ok: false, mensagem: "Token não configurado." };

  try {
    const res = await fetch(`${baseUrlPagBank(cfg?.sandbox === true)}/checkouts`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) return { ok: false, mensagem: "Token inválido (401)." };
    if (!res.ok) return { ok: false, mensagem: `Erro ao conectar (${res.status}).` };
    return { ok: true, mensagem: "Conexão com PagBank OK." };
  } catch (e) {
    return { ok: false, mensagem: e instanceof Error ? e.message : "Erro ao testar conexão." };
  }
}

