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
  initialNome?: string;
  initialEmail?: string;
  initialTelefone?: string;
  initialCpf?: string;
};

export function CheckoutContent({ iconePixUrl, initialNome, initialEmail, initialTelefone, initialCpf }: CheckoutContentProps) {
  const { itens, total, clearCart } = useCart();
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [nome, setNome] = useState(initialNome ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [cpf, setCpf] = useState(initialCpf ? formatarCPF(initialCpf) : "");
  const [telefone, setTelefone] = useState(initialTelefone ?? "");
  const [dadosPreenchidosDaConta, setDadosPreenchidosDaConta] = useState(
    Boolean((initialNome ?? "").trim() || (initialEmail ?? "").trim() || (initialTelefone ?? "").trim() || (initialCpf ?? "").trim())
  );

  // PIX
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [numeroPedido, setNumeroPedido] = useState<number | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);

  const [copiaECola, setCopiaECola] = useState<string | null>(null);

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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || "Erro ao criar pedido.");
      return data;
    },
    [nome, email, cpf, telefone, itensPayload]
  );

  async function handlePagBank() {
    setErro(null);
    setLoading(true);
    try {
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
        <h1 className="text-xl font-bold text-white">Pagamento</h1>
        <p className="mt-1 text-zinc-400">
          Pedido <span className="font-semibold text-white">#{numeroPedido}</span> criado.
        </p>
        {erro && (
          <p className="mt-4 rounded-lg bg-red-950/50 p-3 text-sm text-red-300">{erro}</p>
        )}
        <div className="mt-6 rounded-xl border border-zinc-700 bg-zinc-800/50 p-6">
          <p className="text-sm text-zinc-400">
            A confirmação do pagamento acontece pela tela segura do PagBank.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-zinc-700 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-600"
          >
            Voltar à loja
          </Link>
        </div>
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
                  CPF recomendado para melhorar a aprovação no PagBank.
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

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="mb-5 text-xl font-semibold text-white">Forma de pagamento</h2>
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_18px_rgba(16,185,129,0.18)]">
                    <span className="text-sm font-extrabold tracking-wide text-emerald-300">PB</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">PagBank</p>
                    <p className="text-xs text-zinc-400">Pix &amp; Cartão (mesma tela)</p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Seguro • Checkout PagBank
                </span>
              </div>
            </div>

            {erro && (
              <p className="mt-5 rounded-lg bg-red-950/50 p-4 text-sm text-red-300">{erro}</p>
            )}

            <div className="mt-6">
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
  );
}

