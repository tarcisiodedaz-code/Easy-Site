"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import type { ProdutoLoja } from "@/lib/supabase";
import { formatBRL } from "@/lib/utils/formatters";
import { calcularParcela } from "@/lib/utils/formatters";
import { precoEfetivoParaConsole, precoRiscadoParaConsole } from "@/lib/preco-produto";

const WHATSAPP_NUMERO = "5579999204322";

type Props = {
  produto: ProdutoLoja & { descricao?: string | null };
  imagemUrl: string;
  informacoesAdicionaisHtml: string;
  descricaoHtml: string;
  taxaCartaoInicial?: number;
  iconeMercadoPagoInicial?: string | null;
  iconePixInicial?: string | null;
  iconePS4Inicial?: string | null;
  iconePS5Inicial?: string | null;
};

function PS4Icon({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.393-1.502z" />
    </svg>
  );
}

function PS5Icon({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.393-1.502z" />
    </svg>
  );
}

export function ProdutoPageClient({
  produto,
  imagemUrl,
  informacoesAdicionaisHtml,
  descricaoHtml,
  taxaCartaoInicial = 5,
  iconeMercadoPagoInicial = null,
  iconePixInicial = null,
  iconePS4Inicial = null,
  iconePS5Inicial = null,
}: Props) {
  const router = useRouter();
  const { addItem, itens } = useCart();
  const [versaoSelecionada, setVersaoSelecionada] = useState<"ps4" | "ps5" | null>(null);
  const [adicionado, setAdicionado] = useState(false);
  const [mostrarParcelas, setMostrarParcelas] = useState(false);

  const taxaCartao = taxaCartaoInicial;
  const iconeMercadoPago = iconeMercadoPagoInicial;
  const iconePix = iconePixInicial;
  const iconePS4 = iconePS4Inicial;
  const iconePS5 = iconePS5Inicial;

  const disponivelPs4 = produto.disponivel_ps4 !== false;
  const disponivelPs5 = produto.disponivel_ps5 !== false;
  const indisponivel = produto.gerenciar_estoque === true && (produto.quantidade_estoque ?? 0) <= 0;

  useEffect(() => {
    if (disponivelPs5 && !disponivelPs4) {
      setVersaoSelecionada("ps5");
    } else if (disponivelPs4 && !disponivelPs5) {
      setVersaoSelecionada("ps4");
    }
  }, [disponivelPs4, disponivelPs5]);

  const precoExibir = versaoSelecionada
    ? precoEfetivoParaConsole(produto, versaoSelecionada)
    : 0;
  const precoRiscado = versaoSelecionada
    ? precoRiscadoParaConsole(produto, versaoSelecionada)
    : null;
  const baseNum = Number(produto.preco) || 0;
  const percentualDesconto =
    versaoSelecionada && baseNum > 0 && precoExibir < baseNum
      ? Math.round(((baseNum - precoExibir) / baseNum) * 100)
      : 0;

  const precoComTaxa = precoExibir + (precoExibir * taxaCartao / 100);
  const parcela = precoExibir > 0 ? calcularParcela(precoExibir, taxaCartao) : 0;
  const precoFormatado = formatBRL(precoExibir);
  const whatsappMsg = `Olá! Gostaria de comprar: ${produto.nome} (${versaoSelecionada?.toUpperCase() || "PS5"}) - ${precoFormatado}`;

  const produtoId = produto.id ?? produto.id_externo;
  const jaNoCarrinho = itens.some((item) => item.id === produtoId);

  function handleAddToCart() {
    if (!versaoSelecionada || indisponivel) return;

    if (jaNoCarrinho || adicionado) {
      router.push("/carrinho");
      return;
    }

    addItem({
      id: produtoId,
      nome: `${produto.nome} (${versaoSelecionada.toUpperCase()})`,
      preco: precoExibir,
      imagem_url: produto.imagem_url,
    });
    setAdicionado(true);
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr_minmax(0,280px)]">
      {/* Coluna 1: Imagem */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-zinc-900">
        <Image
          src={imagemUrl}
          alt={produto.nome}
          width={400}
          height={500}
          className="h-full w-full object-cover"
          priority
          unoptimized={imagemUrl.startsWith("http") && !imagemUrl.includes("supabase")}
        />
        {versaoSelecionada && percentualDesconto > 0 && (
          <div className="absolute left-3 top-3 z-10">
            <span className="inline-flex rounded-md bg-red-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
              -{percentualDesconto}%
            </span>
          </div>
        )}
      </div>

      {/* Coluna 2: Informações e preços */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
          {produto.nome}
        </h1>

        <div className="mt-6 space-y-3">
          {!versaoSelecionada ? (
            <p className="text-lg text-zinc-400">Selecione o console para ver o preço</p>
          ) : (
            <>
              {/* Preço PIX */}
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-emerald-400">{precoFormatado}</span>
                {precoRiscado != null && (
                  <span className="text-lg text-zinc-500 line-through">{formatBRL(precoRiscado)}</span>
                )}
              </div>

              {/* Parcelamento */}
              <p className="text-sm text-zinc-300">
                Ou <span className="font-semibold text-white">12x</span> de{" "}
                <span className="font-semibold text-emerald-400">{formatBRL(parcela)}</span> no cartão
              </p>
            </>
          )}

          {/* Métodos de pagamento */}
          <div className="mt-6 space-y-4">
            {/* Mercado Pago Card */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-4">
                {iconeMercadoPago ? (
                  <img
                    src={iconeMercadoPago}
                    alt="Mercado Pago"
                    className="h-10 w-10 shrink-0 object-contain"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00AEEF]">
                    <span className="text-[10px] font-bold text-white">MP</span>
                  </div>
                )}
                <span className="text-sm font-medium text-white">Cartão via Mercado Pago</span>
              </div>
              {versaoSelecionada && precoExibir > 0 && (
                <button
                  type="button"
                  onClick={() => setMostrarParcelas(!mostrarParcelas)}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  {mostrarParcelas ? "Ocultar parcelas" : "Ver parcelas"}
                </button>
              )}
              {versaoSelecionada && mostrarParcelas && precoExibir > 0 && (
                <div className="w-full rounded-lg bg-zinc-800/80 px-3 py-2 text-xs text-zinc-300">
                  12x de {formatBRL(parcela)} (com juros conforme taxa do site)
                </div>
              )}
            </div>

            {/* Pix */}
            <div className="flex items-center gap-4">
              {iconePix ? (
                <img
                  src={iconePix}
                  alt="Pix"
                  className="h-10 w-10 shrink-0 object-contain"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#32BCAD]">
                  <span className="text-[10px] font-bold text-white">PIX</span>
                </div>
              )}
              <span className="text-sm font-medium text-white">Pague com Pix</span>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="mt-8 flex flex-col gap-3">
          {indisponivel ? (
            <div className="rounded-xl border border-amber-600/50 bg-amber-950/20 py-3 text-center text-sm text-amber-400">
              Produto indisponível no momento
            </div>
          ) : (
            <>
              <button
                onClick={handleAddToCart}
                disabled={!versaoSelecionada && !jaNoCarrinho && !adicionado}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold uppercase tracking-wide transition-all ${
                  versaoSelecionada || jaNoCarrinho || adicionado
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "cursor-not-allowed bg-zinc-700 text-zinc-400"
                }`}
              >
                {jaNoCarrinho || adicionado
                  ? "✓ Ir para o carrinho"
                  : versaoSelecionada
                    ? "Adicionar ao carrinho"
                    : "Selecione seu console para continuar"}
              </button>

              <a
                href={versaoSelecionada ? `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(whatsappMsg)}` : "#"}
                target={versaoSelecionada ? "_blank" : undefined}
                rel="noopener noreferrer"
                onClick={(e) => !versaoSelecionada && e.preventDefault()}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 px-6 py-2.5 text-sm font-semibold transition-colors ${
                  versaoSelecionada
                    ? "border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                    : "cursor-not-allowed border-zinc-600 text-zinc-500"
                }`}
              >
                Comprar agora via WhatsApp
              </a>
            </>
          )}
        </div>
      </div>

      {/* Coluna 3: Seletor de versão */}
      <div className="lg:pl-4">
        <h3 className="mb-4 text-xl font-bold uppercase tracking-wider text-white">
          SELECIONE SEU CONSOLE
        </h3>
        <div className="flex flex-col gap-3">
          {disponivelPs4 && (
            <button
              onClick={() => setVersaoSelecionada("ps4")}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 bg-zinc-800/80 p-6 transition-all duration-300 ${
                versaoSelecionada === "ps4"
                  ? "border-[#0070D1]"
                  : "border-zinc-700 hover:border-zinc-600"
              }`}
              style={versaoSelecionada === "ps4" ? {
                boxShadow: "0 0 15px rgba(0, 112, 209, 0.5), 0 0 30px rgba(0, 112, 209, 0.3), inset 0 0 15px rgba(0, 112, 209, 0.1)"
              } : undefined}
            >
              {iconePS4 ? (
                <img src={iconePS4} alt="PS4" className="mb-2 h-10 w-10 object-contain" />
              ) : (
                <PS4Icon className="mb-2 h-10 w-10 text-zinc-300" />
              )}
              <span className="text-lg font-bold text-white">PS4</span>
              {versaoSelecionada === "ps4" && (
                <div className="absolute -right-1 -top-1 flex items-center gap-1 rounded-full bg-[#0070D1] px-2 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-[#0070D1]/50">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  SELECIONADO
                </div>
              )}
            </button>
          )}

          {disponivelPs5 && (
            <button
              onClick={() => setVersaoSelecionada("ps5")}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 bg-zinc-800/80 p-6 transition-all duration-300 ${
                versaoSelecionada === "ps5"
                  ? "border-white"
                  : "border-zinc-700 hover:border-zinc-600"
              }`}
              style={versaoSelecionada === "ps5" ? {
                boxShadow: "0 0 15px rgba(255, 255, 255, 0.4), 0 0 30px rgba(255, 255, 255, 0.2), inset 0 0 15px rgba(255, 255, 255, 0.05)"
              } : undefined}
            >
              {iconePS5 ? (
                <img src={iconePS5} alt="PS5" className="mb-2 h-10 w-10 object-contain" />
              ) : (
                <PS5Icon className="mb-2 h-10 w-10 text-zinc-300" />
              )}
              <span className="text-lg font-bold text-white">PS5</span>
              {versaoSelecionada === "ps5" && (
                <div className="absolute -right-1 -top-1 flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-900 shadow-lg shadow-white/50">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  SELECIONADO
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
