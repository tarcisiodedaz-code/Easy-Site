"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { useCart } from "@/context/CartContext";
import { getImagemAltaResolucao } from "@/lib/imagem-playstation";
import { formatBRL } from "@/lib/utils/formatters";

function formatarCPF(v: string) {
  const n = v.replace(/\D/g, "").slice(0, 11);
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
    [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "")
  );
}

function formatarTelefone(v: string) {
  const n = v.replace(/\D/g, "").slice(0, 13);
  if (n.length <= 2) return n ? `(${n}` : "";
  if (n.length <= 6) return n.replace(/(\d{2})(\d{0,4})/, "($1) $2");
  if (n.length <= 11) return n.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  // 13 dígitos (55 + DDD + número)
  return n.replace(/(\d{2})(\d{2})(\d{5})(\d{0,4})/, "($1) $2 $3-$4");
}

type Step = "form" | "pix_wait" | "card_form" | "success";

type CheckoutContentProps = {
  iconePixUrl?: string | null;
  iconeMercadoPagoUrl?: string | null;
  initialNome?: string;
  initialEmail?: string;
  initialTelefone?: string;
  initialCpf?: string;
};

export function CheckoutContent({ iconePixUrl, iconeMercadoPagoUrl, initialNome, initialEmail, initialTelefone, initialCpf }: CheckoutContentProps) {
  const { itens, total, clearCart } = useCart();
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [nome, setNome] = useState(initialNome ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [cpf, setCpf] = useState(initialCpf ? formatarCPF(initialCpf) : "");
  const [telefone, setTelefone] = useState(initialTelefone ?? "");
  const [metodo, setMetodo] = useState<"pix" | "card">("pix");
  const [dadosPreenchidosDaConta, setDadosPreenchidosDaConta] = useState(
    Boolean((initialNome ?? "").trim() || (initialEmail ?? "").trim() || (initialTelefone ?? "").trim() || (initialCpf ?? "").trim())
  );

  // PIX
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [numeroPedido, setNumeroPedido] = useState<number | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);

  // Device ID do Mercado Pago (melhora aprovação e pontuação da integração)
  useEffect(() => {
    if (typeof document === "undefined" || document.getElementById("mp-security-script")) return;
    const script = document.createElement("script");
    script.id = "mp-security-script";
    script.src = "https://www.mercadopago.com/v2/security.js";
    script.setAttribute("view", "checkout");
    script.async = true;
    document.body.appendChild(script);
    return () => {
      const el = document.getElementById("mp-security-script");
      if (el?.parentNode) el.parentNode.removeChild(el);
    };
  }, []);
  const [copiaECola, setCopiaECola] = useState<string | null>(null);

  // Config MP (public key)
  const [mpPublicKey, setMpPublicKey] = useState("");
  useEffect(() => {
    fetch("/api/mercado-pago/config")
      .then((r) => r.json())
      .then((d) => setMpPublicKey(d.publicKey || ""))
      .catch(() => {});
  }, []);

  // Preencher dados do cliente com a conta logada (quando existir sessão)
  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (cancelled || !session?.user) return;
        const u = session.user;
        const name = (u.user_metadata?.full_name as string)?.trim() ?? "";
        const mail = (u.email ?? "").trim();
        const phoneRaw = (u.user_metadata?.phone_number as string) ?? "";
        const phoneDigits = phoneRaw.replace(/\D/g, "").slice(0, 11);
        const phoneCom55 = phoneDigits.startsWith("55") ? phoneDigits.slice(0, 13) : "55" + phoneDigits;
        const cpfRaw = (u.user_metadata?.cpf as string) ?? "";
        const cpfDigits = cpfRaw.replace(/\D/g, "").slice(0, 11);
        if (name || mail || phoneDigits || cpfDigits) {
          setNome((prev) => (prev === "" ? name : prev));
          setEmail((prev) => (prev === "" ? mail : prev));
          setTelefone((prev) => (prev === "" && phoneCom55.length > 2 ? phoneCom55 : prev));
          setCpf((prev) => (prev === "" && cpfDigits.length === 11 ? formatarCPF(cpfDigits) : prev));
          setDadosPreenchidosDaConta(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Esvaziar o carrinho quando o pedido for concluído com sucesso
  useEffect(() => {
    if (step === "success") clearCart();
  }, [step, clearCart]);

  const isEmpty = itens.length === 0;

  const itensPayload = itens.map((i) => ({
    produto_id: i.id,
    produto_nome: i.nome,
    preco_unitario: i.preco,
    quantidade: i.quantidade,
  }));

  const criarPedido = useCallback(
    async (forma: "pix" | "credit_card") => {
      const deviceId =
        typeof window !== "undefined" ? (window as Window & { MP_DEVICE_SESSION_ID?: string }).MP_DEVICE_SESSION_ID : undefined;
      const res = await fetch("/api/pedidos/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_nome: nome.trim(),
          cliente_email: email.trim(),
          cliente_cpf: cpf.replace(/\D/g, "").slice(0, 11) || undefined,
          cliente_telefone: (() => {
          const d = telefone.replace(/\D/g, "").slice(0, 13);
          return d.length >= 11 ? (d.startsWith("55") ? d : "55" + d.slice(0, 11)) : undefined;
        })(),
          forma_pagamento: forma,
          itens: itensPayload,
          ...(deviceId ? { device_id: deviceId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || "Erro ao criar pedido.");
      return data;
    },
    [nome, email, cpf, telefone, itensPayload]
  );

  // Polling PIX
  useEffect(() => {
    if (step !== "pix_wait" || !pedidoId) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/pedidos/${pedidoId}/status`);
        const d = await r.json();
        if (d.situacao === "pago") {
          setStep("success");
          clearInterval(t);
        } else if (d.situacao === "rejeitado") {
          setErro(d.mensagem ?? "Pagamento recusado.");
          clearInterval(t);
        }
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(t);
  }, [step, pedidoId]);

  async function handlePix() {
    setErro(null);
    setLoading(true);
    try {
      const data = await criarPedido("pix");
      setPedidoId(data.pedidoId);
      setNumeroPedido(data.numero);
      setQrCodeBase64(data.qr_code_base64 ?? null);
      setCopiaECola(data.copia_e_cola ?? null);
      setStep("pix_wait");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao gerar PIX.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePagBank() {
    setErro(null);
    setLoading(true);
    try {
      // Criar pedido sem disparar geração de PIX no Mercado Pago
      const data = await criarPedido("credit_card");
      const res = await fetch("/api/pagbank/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId: data.pedidoId,
          cliente_nome: nome.trim(),
          cliente_email: email.trim(),
          cliente_cpf: cpf.replace(/\D/g, "").slice(0, 11) || undefined,
          cliente_telefone: (() => {
            const d = telefone.replace(/\D/g, "").slice(0, 13);
            return d.length >= 11 ? (d.startsWith("55") ? d : "55" + d.slice(0, 11)) : undefined;
          })(),
        }),
      });
      const d = await res.json();
      if (!res.ok || !d?.pay_url) throw new Error(d?.erro || "Erro ao iniciar pagamento no PagBank.");
      window.location.href = String(d.pay_url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao iniciar PagBank.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCartao(token: string, installments: number) {
    setErro(null);
    setLoading(true);
    try {
      const data = await criarPedido("credit_card");
      const deviceId =
        typeof window !== "undefined" ? (window as Window & { MP_DEVICE_SESSION_ID?: string }).MP_DEVICE_SESSION_ID : undefined;
      const res = await fetch("/api/pagamentos/cartao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId: data.pedidoId,
          token,
          installments,
          payer_nome: nome.trim(),
          ...(deviceId ? { device_id: deviceId } : {}),
        }),
      });
      const result = await res.json();
      if (result.ok && result.status === "approved") {
        setNumeroPedido(result.numero);
        setStep("success");
      } else {
        setErro(result.erro || "Pagamento recusado. Tente outro cartão.");
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao processar cartão.");
    } finally {
      setLoading(false);
    }
  }

  if (isEmpty && step === "form") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-white">Checkout</h1>
        <p className="mt-4 text-zinc-400">Seu carrinho está vazio.</p>
        <Link
          href="/carrinho"
          className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-white"
        >
          Ver carrinho
        </Link>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="rounded-xl border border-emerald-800 bg-emerald-950/40 p-8">
          <h1 className="text-2xl font-bold text-emerald-400">Obrigado pela compra!</h1>
          <p className="mt-3 text-lg font-medium text-white">Pagamento aprovado.</p>
          {numeroPedido != null && (
            <p className="mt-2 text-zinc-300">Pedido #{numeroPedido}</p>
          )}
          <p className="mt-6 text-zinc-300">
            Em instantes o jogo será enviado para você.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Você receberá um e-mail com os detalhes e o acesso ao produto.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-500"
          >
            Voltar à loja
          </Link>
        </div>
      </div>
    );
  }

  if (step === "pix_wait") {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-xl font-bold text-white">Pague com PIX</h1>
        <p className="mt-1 text-zinc-400">Escaneie o QR Code ou copie o código.</p>
        {erro && (
          <p className="mt-4 rounded-lg bg-red-950/50 p-3 text-sm text-red-300">{erro}</p>
        )}
        <div className="mt-6 rounded-xl border border-zinc-700 bg-zinc-800/50 p-6">
          {qrCodeBase64 && (
            <div className="flex justify-center">
              <img
                src={`data:image/png;base64,${qrCodeBase64}`}
                alt="QR Code PIX"
                className="h-48 w-48"
              />
            </div>
          )}
          {copiaECola && (
            <div className="mt-4">
              <label className="block text-sm text-zinc-400">Copia e cola</label>
              <textarea
                readOnly
                value={copiaECola}
                className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 p-2 text-xs text-zinc-300"
                rows={4}
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(copiaECola)}
                className="mt-2 rounded bg-zinc-700 px-3 py-1.5 text-sm text-white hover:bg-zinc-600"
              >
                Copiar
              </button>
            </div>
          )}
          <p className="mt-4 text-center text-sm text-zinc-500">
            Aguardando confirmação do pagamento...
          </p>
        </div>
      </div>
    );
  }

  if (step === "card_form") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <button
          type="button"
          onClick={() => setStep("form")}
          className="mb-4 text-sm text-zinc-400 hover:text-white"
        >
          ← Voltar
        </button>
        <h1 className="text-xl font-bold text-white">Cartão de crédito</h1>
        {erro && (
          <p className="mt-4 rounded-lg bg-red-950/50 p-3 text-sm text-red-300">{erro}</p>
        )}
        {mpPublicKey ? (
          <CheckoutCardForm
            total={total}
            nome={nome}
            cpf={cpf.replace(/\D/g, "")}
            onSuccess={(token, installments) => handleCartao(token, installments)}
            onError={(msg) => setErro(msg)}
            loading={loading}
          />
        ) : (
          <p className="mt-4 text-zinc-500">Mercado Pago não configurado. Use PIX ou configure no admin.</p>
        )}
      </div>
    );
  }

  // step === "form"
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold text-white">Checkout</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        {/* Coluna Esquerda - Resumo do Pedido */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-5 text-xl font-semibold text-white">Resumo do pedido</h2>
          <ul className="space-y-4 max-h-[220px] overflow-y-auto">
            {itens.map((i) => (
              <li key={i.id} className="flex gap-4">
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                  {i.imagem_url && (
                    <Image
                      src={getImagemAltaResolucao(i.imagem_url)}
                      alt={i.nome}
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white text-base">{i.nome}</p>
                  <p className="text-sm text-zinc-500">
                    {formatBRL(i.preco)} × {i.quantidade}
                  </p>
                </div>
                <p className="font-semibold text-white text-base">
                  {formatBRL(i.preco * i.quantidade)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-zinc-700 pt-5 flex justify-between text-xl font-bold text-white">
            <span>Total</span>
            <span className="text-emerald-400">{formatBRL(total)}</span>
          </div>
        </div>

        {/* Coluna Direita - Dados e Pagamento */}
        <div className="space-y-6">
          {/* Dados do Cliente */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold text-white">Dados do cliente</h2>
              {dadosPreenchidosDaConta && (
                <span className="text-sm text-emerald-400">
                  ✓ Usando os dados da sua conta
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-zinc-400">Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-zinc-400">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-zinc-400">CPF</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatarCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white focus:border-zinc-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  O CPF é obrigatório para o processamento do pagamento pelo Mercado Pago.
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm text-zinc-400">Telefone / WhatsApp</label>
                <input
                  type="tel"
                  value={formatarTelefone(telefone)}
                  onChange={(e) => setTelefone(e.target.value.replace(/\D/g, "").slice(0, 13))}
                  placeholder="(55) 79 99999-9999"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white focus:border-zinc-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="mb-5 text-xl font-semibold text-white">Forma de pagamento</h2>
            <div className="grid grid-cols-2 gap-5">
              {/* Card PIX */}
              <button
                type="button"
                onClick={() => setMetodo("pix")}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-5 transition-all duration-200 ${
                  metodo === "pix"
                    ? "border-emerald-500 bg-emerald-950/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                }`}
              >
                {metodo === "pix" && (
                  <span className="absolute -top-2.5 -right-2 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                    SELECIONADO
                  </span>
                )}
                <div className="flex h-14 w-14 items-center justify-center">
                  {iconePixUrl ? (
                    <img src={iconePixUrl} alt="PIX" className="h-12 w-12 object-contain" />
                  ) : (
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${metodo === "pix" ? "bg-emerald-500/20" : "bg-zinc-700"}`}>
                      <span className={`text-lg font-bold ${metodo === "pix" ? "text-emerald-400" : "text-zinc-400"}`}>PIX</span>
                    </div>
                  )}
                </div>
                <span className={`text-base font-semibold ${metodo === "pix" ? "text-emerald-400" : "text-zinc-300"}`}>
                  PIX
                </span>
                <span className="text-xs text-zinc-500">Aprovação imediata</span>
              </button>

              {/* Card Cartão */}
              <button
                type="button"
                onClick={() => setMetodo("card")}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-5 transition-all duration-200 ${
                  metodo === "card"
                    ? "border-[#00AEEF] bg-[#00AEEF]/10 shadow-[0_0_20px_rgba(0,174,239,0.2)]"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                }`}
              >
                {metodo === "card" && (
                  <span className="absolute -top-2.5 -right-2 rounded-full bg-[#00AEEF] px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                    SELECIONADO
                  </span>
                )}
                <div className="flex h-14 w-14 items-center justify-center">
                  {iconeMercadoPagoUrl ? (
                    <img src={iconeMercadoPagoUrl} alt="Mercado Pago" className="h-12 w-12 object-contain" />
                  ) : (
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${metodo === "card" ? "bg-[#00AEEF]/20" : "bg-zinc-700"}`}>
                      <span className={`text-lg font-bold ${metodo === "card" ? "text-[#00AEEF]" : "text-zinc-400"}`}>MP</span>
                    </div>
                  )}
                </div>
                <span className={`text-base font-semibold ${metodo === "card" ? "text-[#00AEEF]" : "text-zinc-300"}`}>
                  Cartão de Crédito
                </span>
                <span className="text-xs text-zinc-500">Via Mercado Pago</span>
              </button>
            </div>

            {erro && (
              <p className="mt-5 rounded-lg bg-red-950/50 p-4 text-sm text-red-300">{erro}</p>
            )}

            <div className="mt-6">
              {metodo === "pix" && (
                <button
                  type="button"
                  onClick={handlePix}
                  disabled={loading || !nome.trim() || !email.trim()}
                  className="w-full rounded-xl bg-emerald-600 py-3.5 text-lg font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Gerando PIX…" : "Pagar com PIX"}
                </button>
              )}
              {metodo === "card" && (
                <button
                  type="button"
                  onClick={() => setStep("card_form")}
                  disabled={!nome.trim() || !email.trim()}
                  className="w-full rounded-xl bg-[#00AEEF] py-3.5 text-lg font-semibold text-white hover:bg-[#0099d4] disabled:opacity-50 transition-colors"
                >
                  Pagar com Cartão
                </button>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={handlePagBank}
                  disabled={loading || !nome.trim() || !email.trim()}
                  className="relative w-full overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-cyan-400/10 py-3.5 text-lg font-semibold text-white shadow-[0_0_28px_rgba(16,185,129,0.18)] transition-all hover:border-emerald-400/60 hover:shadow-[0_0_34px_rgba(16,185,129,0.26)] disabled:opacity-50"
                >
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.28),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(34,211,238,0.18),transparent_50%)]" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      "Iniciando PagBank…"
                    ) : (
                      <>
                        <span>Pagar com PagBank</span>
                        <span className="text-sm font-semibold text-emerald-200/90">Pix &amp; Cartão</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente que usa o SDK do MP para tokenizar o cartão (CardForm ou createCardToken)
declare global {
  interface Window {
    MercadoPago?: new (key: string, options?: { locale: string }) => {
      createCardToken: (params: {
        cardNumber: string;
        cardholderName: string;
        cardExpirationMonth: string;
        cardExpirationYear: string;
        securityCode: string;
        identificationType: string;
        identificationNumber: string;
      }) => Promise<{ id: string }>;
    };
  }
}

function CheckoutCardForm({
  total,
  nome,
  cpf,
  onSuccess,
  onError,
  loading,
}: {
  total: number;
  nome: string;
  cpf: string;
  onSuccess: (token: string, installments: number) => void;
  onError: (msg: string) => void;
  loading: boolean;
}) {
  const [scriptOk, setScriptOk] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState(nome);
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [installments, setInstallments] = useState(1);
  const [tokenizing, setTokenizing] = useState(false);

  useEffect(() => {
    setCardName(nome);
  }, [nome]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mercado-pago/config")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.publicKey) {
          setPublicKey(d.publicKey);
          if (window.MercadoPago) {
            setScriptOk(true);
            return;
          }
          const script = document.createElement("script");
          script.src = "https://sdk.mercadopago.com/js/v2";
          script.async = true;
          script.onload = () => setScriptOk(true);
          document.body.appendChild(script);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!publicKey || !window.MercadoPago) {
      onError("SDK do Mercado Pago não carregado.");
      return;
    }
    
    setTokenizing(true);
    
    try {
      const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
      const [month, year] = expMonth.split("/").map((s) => s.trim());
      const yearFull = year?.length === 2 ? `20${year}` : (year || "2030");
      const cardNum = cardNumber.replace(/\D/g, "");
      const cpfNum = cpf.replace(/\D/g, "") || "12345678909";
      
      const result = await mp.createCardToken({
        cardNumber: cardNum,
        cardholderName: cardName.toUpperCase(),
        cardExpirationMonth: month || "11",
        cardExpirationYear: yearFull,
        securityCode: cvv.replace(/\D/g, ""),
        identificationType: "CPF",
        identificationNumber: cpfNum,
      });
      
      if (result?.id) {
        onSuccess(result.id, installments);
      } else {
        onError("Não foi possível tokenizar o cartão. Verifique os dados.");
      }
    } catch (err: unknown) {
      console.error("Erro ao gerar token:", err);
      const errorObj = err as { message?: string; cause?: Array<{ code?: string; description?: string }> };
      const cause = errorObj?.cause?.[0];
      if (cause?.code) {
        const errorMessages: Record<string, string> = {
          "bin_not_found": "Cartão não reconhecido. Use um cartão válido ou de teste do Mercado Pago.",
          "invalid_card_number": "Número do cartão inválido.",
          "invalid_expiration_date": "Data de validade inválida.",
          "invalid_security_code": "CVV inválido.",
          "invalid_cardholder_name": "Nome do titular inválido.",
        };
        onError(errorMessages[cause.code] || cause.description || `Erro: ${cause.code}`);
      } else {
        onError(errorObj?.message || "Erro ao processar cartão.");
      }
    } finally {
      setTokenizing(false);
    }
  }

  const maxParcelas = total >= 100 ? 12 : total >= 50 ? 6 : 3;
  const parcelasOpcoes = Array.from({ length: maxParcelas }, (_, i) => i + 1);

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-zinc-700 bg-zinc-800/50 p-6">
      <div>
        <label className="mb-1 block text-sm text-zinc-400">Número do cartão</label>
        <input
          type="text"
          autoComplete="cc-number"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})/g, "$1 ").trim())}
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-white"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-400">Nome no cartão</label>
        <input
          type="text"
          autoComplete="cc-name"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Validade (MM/AA)</label>
          <input
            type="text"
            autoComplete="cc-exp"
            value={expMonth}
            onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2"))}
            placeholder="MM/AA"
            maxLength={5}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">CVV</label>
          <input
            type="text"
            autoComplete="cc-csc"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="123"
            maxLength={4}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-white"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-400">Parcelas</label>
        <select
          value={installments}
          onChange={(e) => setInstallments(Number(e.target.value))}
          className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-white"
        >
          {parcelasOpcoes.map((n) => (
            <option key={n} value={n}>
              {n}x de {formatBRL(total / n)} {n > 1 ? "sem juros" : ""}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading || tokenizing || !scriptOk}
        className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {tokenizing ? "Validando cartão…" : loading ? "Processando pagamento…" : "Pagar"}
      </button>
    </form>
  );
}
