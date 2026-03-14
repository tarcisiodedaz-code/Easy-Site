"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { getImagemAltaResolucao } from "@/lib/imagem-playstation";
import { MeusPedidosTab } from "./MeusPedidosTab";
import { createClient } from "@/lib/supabase/browser";
import { formatBRL } from "@/lib/utils/formatters";

const WHATSAPP_NUMERO = "5579999204322";

type Tab = "carrinho" | "pedidos";

export function CarrinhoContent() {
  const { itens, total, removeItem, updateQuantidade, count } = useCart();
  const [tab, setTab] = useState<Tab>("carrinho");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isEmpty = itens.length === 0;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  const linhasPedido = itens
    .map((i) => `${i.nome} x${i.quantidade} - ${formatBRL(i.preco * i.quantidade)}`)
    .join("\n");
  const mensagemWhatsApp = isEmpty
    ? "Olá! Gostaria de mais informações sobre os produtos."
    : `Olá! Gostaria de finalizar meu pedido:\n\n${linhasPedido}\n\nTotal: ${formatBRL(total)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Abas */}
      <div className="flex gap-1 border-b border-zinc-700 mb-8">
        <button
          type="button"
          onClick={() => setTab("carrinho")}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 -mb-[2px] ${
            tab === "carrinho"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          Carrinho
          {count > 0 && (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
              {count}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("pedidos")}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 -mb-[2px] ${
            tab === "pedidos"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Meus Pedidos
        </button>
      </div>

      {/* Conteúdo da aba Pedidos */}
      {tab === "pedidos" && (
        <div>
          {isLoggedIn ? (
            <MeusPedidosTab />
          ) : (
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-12 text-center">
              <div className="text-4xl mb-4">🔒</div>
              <p className="text-zinc-400">Faça login para ver seus pedidos.</p>
              <Link
                href="/login?redirect=/carrinho"
                className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-500"
              >
                Entrar
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da aba Carrinho */}
      {tab === "carrinho" && (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {isEmpty ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
                <p className="text-zinc-400">Seu carrinho está vazio.</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Adicione jogos pela home ou pelas ofertas.
                </p>
                <Link
                  href="/categorias/ofertas"
                  className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
                >
                  Ver ofertas
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {itens.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-nowrap"
                  >
                    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                      {item.imagem_url ? (
                        <Image
                          src={getImagemAltaResolucao(item.imagem_url)}
                          alt={item.nome}
                          fill
                          className="object-cover"
                          sizes="56px"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                          ?
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/produto/${item.id}`}
                        className="font-medium text-white hover:text-[var(--accent)]"
                      >
                        {item.nome}
                      </Link>
                      <p className="text-sm text-zinc-500">
                        {formatBRL(item.preco)} × {item.quantidade}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={item.quantidade}
                        onChange={(e) =>
                          updateQuantidade(item.id, Number(e.target.value))
                        }
                        className="rounded border border-[var(--border)] bg-zinc-800 px-2 py-1 text-sm text-white"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <span className="font-semibold text-[var(--accent)]">
                        {formatBRL(item.preco * item.quantidade)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-red-400"
                        aria-label="Remover"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="sticky top-24 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
              <h2 className="text-lg font-semibold text-white">Resumo do pedido</h2>
              <div className="mt-4 flex justify-between text-zinc-400">
                <span>Total ({itens.reduce((s, i) => s + i.quantidade, 0)} itens)</span>
                <span className="text-xl font-bold text-white">
                  {formatBRL(total)}
                </span>
              </div>
              <Link
                href="/checkout"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3.5 font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                Finalizar compra (PIX ou Cartão)
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagemWhatsApp)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-600 py-3 font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Finalizar compra via WhatsApp
              </a>
              <p className="mt-3 text-center text-xs text-zinc-500">
                Pague no site com PIX ou cartão, ou pelo WhatsApp.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
