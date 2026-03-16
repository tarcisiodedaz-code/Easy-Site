"use server";

import { setLojaConfig } from "@/lib/loja-config";
import type { WhatsappNotificacaoConfig } from "@/types/loja-config";

const CALLMEBOT_URL = "https://api.callmebot.com/whatsapp.php";

export async function salvarWhatsappNotificacao(data: {
  ativo: boolean;
  numero: string;
  apikey: string;
}): Promise<{ ok: boolean; erro?: string }> {
  const config: WhatsappNotificacaoConfig = {
    ativo: data.ativo,
    numero: (data.numero ?? "").trim().replace(/\D/g, ""),
    apikey: (data.apikey ?? "").trim(),
  };
  return setLojaConfig("whatsapp_notificacao", config);
}

/** Envia uma mensagem de teste para o WhatsApp (CallMeBot). */
export async function enviarTesteWhatsApp(numero: string, apikey: string): Promise<{
  ok: boolean;
  mensagem?: string;
}> {
  const num = (numero ?? "").trim().replace(/\D/g, "");
  const key = (apikey ?? "").trim();
  if (!num || !key) {
    return { ok: false, mensagem: "Preencha número e chave API antes de testar." };
  }
  try {
    const texto = "Teste – Notificação de pedidos Easy Games. Se você recebeu isso, está tudo certo!";
    const phone = num.startsWith("55") ? num : "55" + num;
    const url = `${CALLMEBOT_URL}?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(texto)}&apikey=${encodeURIComponent(key)}`;
    const res = await fetch(url, { method: "GET" });
    const body = await res.text();
    if (res.ok) {
      return { ok: true, mensagem: "Mensagem de teste enviada. Confira seu WhatsApp." };
    }
    const motivo = (body || res.statusText || "Sem resposta").slice(0, 200);
    return {
      ok: false,
      mensagem: `CallMeBot respondeu: ${motivo}. Se a chave expirou, no WhatsApp envie de novo "I allow callmebot to send me messages" para +34 644 37 67 94 e use a nova chave.`,
    };
  } catch (e) {
    return { ok: false, mensagem: "Erro ao enviar: " + String(e) };
  }
}
