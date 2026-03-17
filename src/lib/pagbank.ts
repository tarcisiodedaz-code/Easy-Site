import { getLojaConfig } from "@/lib/loja-config";
import type { PagBankConfig } from "@/types/loja-config";

type CheckoutItem = {
  reference_id: string;
  name: string;
  quantity: number;
  unit_amount: number; // centavos
};

type Phone = { country: "+55"; area: string; number: string };

export type CriarCheckoutPagBankParams = {
  reference_id: string;
  customer?: {
    name: string;
    email: string;
    tax_id?: string;
    phone?: Phone;
  };
  items: CheckoutItem[];
  redirect_url: string;
  return_url: string;
  notification_urls?: string[];
  payment_notification_urls?: string[];
};

export async function getPagBankConfig(): Promise<PagBankConfig> {
  return getLojaConfig("pagbank");
}

function getPagBankBaseUrl(sandbox: boolean): string {
  return sandbox ? "https://sandbox.api.pagseguro.com" : "https://api.pagseguro.com";
}

function parsePayUrl(links: unknown): string | null {
  if (!Array.isArray(links)) return null;
  for (const l of links) {
    if (l && typeof l === "object") {
      const rel = (l as Record<string, unknown>).rel;
      const href = (l as Record<string, unknown>).href;
      if (rel === "PAY" && typeof href === "string") return href;
    }
  }
  return null;
}

function formatPagBankErrors(data: Record<string, unknown>): string | null {
  const errs = data.error_messages;
  if (Array.isArray(errs) && errs.length) {
    const first = errs[0] as Record<string, unknown>;
    const desc = typeof first.description === "string" ? first.description : "";
    const param = typeof first.parameter_name === "string" ? first.parameter_name : "";
    const err = typeof first.error === "string" ? first.error : "";
    const base = desc || err || "Erro de validação";
    return param ? `${base} (${param})` : base;
  }
  const msg = data.message;
  if (typeof msg === "string" && msg.trim()) return msg.trim();
  return null;
}

export async function criarCheckoutPagBank(params: CriarCheckoutPagBankParams): Promise<{
  ok: boolean;
  checkout_id?: string;
  pay_url?: string;
  erro?: string;
}> {
  const config = await getPagBankConfig();
  const raw = config?.token?.trim() || process.env.PAGBANK_TOKEN?.trim();
  const token = raw ? raw.replace(/^Bearer\s+/i, "").trim() : "";
  const sandbox = config?.sandbox === true;
  if (!token) return { ok: false, erro: "PagBank não configurado (token ausente)." };

  const installmentsLimit = String(config?.installments_limit ?? 12);
  const interestFree = String(config?.interest_free_installments ?? 0);
  const softDescriptor = (config?.soft_descriptor ?? "EASYGAMES").slice(0, 17);

  const configOptions: Array<{ option: string; value: string }> = [{ option: "INSTALLMENTS_LIMIT", value: installmentsLimit }];
  // Só envia se for > 0; alguns ambientes rejeitam quando a opção existe com 0
  if (Number(interestFree) > 0) {
    configOptions.push({ option: "INTEREST_FREE_INSTALLMENTS", value: interestFree });
  }

  const body: Record<string, unknown> = {
    reference_id: params.reference_id.slice(0, 64),
    customer_modifiable: true,
    items: params.items,
    payment_methods: [{ type: "PIX" }, { type: "CREDIT_CARD" }],
    payment_methods_configs: [
      {
        type: "CREDIT_CARD",
        config_options: configOptions,
      },
    ],
    soft_descriptor: softDescriptor,
    redirect_url: params.redirect_url,
    return_url: params.return_url,
    ...(params.customer ? { customer: params.customer } : {}),
    ...(params.notification_urls?.length ? { notification_urls: params.notification_urls } : {}),
    ...(params.payment_notification_urls?.length ? { payment_notification_urls: params.payment_notification_urls } : {}),
  };

  try {
    const baseUrl = getPagBankBaseUrl(sandbox);
    const res = await fetch(`${baseUrl}/checkouts`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const msg = formatPagBankErrors(data) || `Erro ${res.status}`;
      return { ok: false, erro: msg };
    }

    const checkoutId = typeof data.id === "string" ? data.id : undefined;
    const payUrl = parsePayUrl(data.links);
    if (!checkoutId || !payUrl) return { ok: false, erro: "PagBank não retornou link de pagamento." };

    return { ok: true, checkout_id: checkoutId, pay_url: payUrl };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Erro ao criar checkout PagBank." };
  }
}

