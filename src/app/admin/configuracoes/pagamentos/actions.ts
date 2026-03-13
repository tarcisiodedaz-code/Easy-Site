"use server";

import { validateAdminSession } from "@/lib/auth-admin";
import { setLojaConfig } from "@/lib/loja-config";
import { testarConexaoMercadoPago } from "@/lib/mercado-pago";
import type { MercadoPagoConfig } from "@/types/loja-config";

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
  return setLojaConfig("mercado_pago", config);
}

export async function testarConexao(): Promise<{ ok: boolean; mensagem: string }> {
  if (!(await validateAdminSession())) {
    return { ok: false, mensagem: "Não autorizado." };
  }
  return testarConexaoMercadoPago();
}
