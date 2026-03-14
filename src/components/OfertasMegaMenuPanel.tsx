"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useEffect, useState, useCallback } from "react";
import { CountdownTimer } from "./CountdownTimer";
import { getImagemAltaResolucao } from "@/lib/imagem-playstation";
import type { ProdutoLoja } from "@/lib/supabase";

const MINI_CARD_WIDTH = 168;
const MINI_GAP = 12;
const MINI_VISIBLE_WIDTH = MINI_CARD_WIDTH * 4 + MINI_GAP * 3; // 708px - precisa caber na coluna direita
const AUTOPLAY_MS = 3000;

function formatarPreco(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function temOfertaValida(produto: ProdutoLoja): boolean {
  const promo = produto.preco_promocional;
  if (promo == null || Number(promo) <= 0) return false;
  const now = Date.now();
  const inicio = produto.oferta_inicio ? new Date(produto.oferta_inicio).getTime() : null;
  const fim = produto.oferta_fim ? new Date(produto.oferta_fim).getTime() : null;
  if (inicio != null && now < inicio) return false;
  if (fim != null && now > fim) return false;
  return true;
}

function calcularParcela(preco: number, taxa: number = 5, parcelas: number = 12): number {
  const precoComTaxa = preco + (preco * taxa / 100);
  return precoComTaxa / parcelas;
}

function MiniCard({ produto, onClick }: { produto: ProdutoLoja; onClick: () => void }) {
  const imagemUrl =
    getImagemAltaResolucao(produto.imagem_url) ||
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80";
  const emOferta = temOfertaValida(produto);
  const precoExibir = emOferta && produto.preco_promocional != null
    ? Number(produto.preco_promocional)
    : produto.preco;
  const precoDe = emOferta ? Number(produto.preco) : produto.preco_original ?? produto.preco;
  const precoDeNum = typeof precoDe === "number" ? precoDe : Number(precoDe) || 0;
  const precoExibirNum = typeof precoExibir === "number" ? precoExibir : Number(precoExibir) || 0;
  const percentualDesconto =
    emOferta && precoDeNum > 0 && precoExibirNum < precoDeNum
      ? Math.round(((precoDeNum - precoExibirNum) / precoDeNum) * 100)
      : 0;
  const slug = (produto as { slug?: string | null }).slug ?? produto.id ?? produto.id_externo;
  const parcela = calcularParcela(precoExibirNum);

  return (
    <Link
      href={`/produto/${slug}`}
      onClick={onClick}
      className="group flex shrink-0 flex-col overflow-hidden rounded-xl bg-white transition-shadow hover:shadow-lg"
      style={{ width: MINI_CARD_WIDTH }}
    >
      {/* Imagem ocupando 100% sem bordas */}
      <div className="relative w-full overflow-hidden bg-zinc-100" style={{ aspectRatio: "3/4" }}>
        <Image
          src={imagemUrl}
          alt={produto.nome}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="180px"
          unoptimized={imagemUrl.startsWith("http") && !imagemUrl.includes("supabase")}
        />
        {/* Badge de desconto - texto ajustado para caber no círculo */}
        {emOferta && percentualDesconto > 0 && (
          <div className="absolute left-1.5 top-1.5 flex h-10 w-10 flex-col items-center justify-center rounded-full bg-red-600 shadow-lg">
            <span className="text-[11px] font-bold leading-none text-white">-{percentualDesconto}%</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-2.5">
        {/* Nome do produto */}
        <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-zinc-800 group-hover:text-zinc-900">
          {produto.nome}
        </h3>
        
        <div className="mt-2 flex flex-col gap-0.5">
          {/* Preço de tabela - riscado */}
          {precoDeNum > precoExibirNum && (
            <p className="text-[10px] text-zinc-400 line-through">
              De {formatarPreco(precoDeNum)}
            </p>
          )}
          
          {/* Preço PIX - destaque azul (cyan) */}
          <p className="text-sm font-bold text-cyan-600">
            {formatarPreco(precoExibirNum)} <span className="text-xs font-medium">no PIX</span>
          </p>
          
          {/* Parcelamento com 5% */}
          <p className="text-[10px] text-zinc-500">
            ou 12x de {formatarPreco(parcela)} no cartão
          </p>
        </div>
      </div>
    </Link>
  );
}

type OfertasMegaMenuPanelProps = {
  produtos: ProdutoLoja[];
  /** Data/hora final global da promoção de ofertas especiais (ISO). */
  dataFinalGlobal?: string | null;
  onClose?: () => void;
};

export function OfertasMegaMenuPanel({ produtos, dataFinalGlobal, onClose }: OfertasMegaMenuPanelProps) {
  // Se não houver data final configurada, usa o próximo domingo como fallback.
  const dataFinal = dataFinalGlobal ?? (() => {
    const d = new Date();
    const day = d.getDay();
    const daysUntilSunday = day === 0 ? 7 : 7 - day;
    d.setDate(d.getDate() + daysUntilSunday);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  })();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const draggedRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || produtos.length === 0) return;
    const targetScroll = page * MINI_VISIBLE_WIDTH;
    requestAnimationFrame(() => {
      el.scrollTo({ left: targetScroll, behavior: "smooth" });
    });
  }, [page, produtos.length]);

  useEffect(() => {
    if (produtos.length <= 4) return;
    const id = setInterval(() => {
      setPage((p) => {
        const max = Math.ceil(produtos.length / 4);
        const next = p + 1;
        return next >= max ? 0 : next;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [produtos.length]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    draggedRef.current = false;
    startXRef.current = e.clientX;
    startScrollLeftRef.current = scrollRef.current.scrollLeft;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    const dx = e.clientX - startXRef.current;
    scrollRef.current.scrollLeft = startScrollLeftRef.current - dx;
    if (Math.abs(dx) > 5) draggedRef.current = true;
  }, []);

  const onMouseUp = useCallback(() => { isDraggingRef.current = false; }, []);
  const onMouseLeave = useCallback(() => { isDraggingRef.current = false; }, []);

  useEffect(() => {
    const onGlobalMouseUp = () => { isDraggingRef.current = false; };
    window.addEventListener("mouseup", onGlobalMouseUp);
    return () => window.removeEventListener("mouseup", onGlobalMouseUp);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const preventClick = (e: MouseEvent) => {
      if (draggedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        draggedRef.current = false;
      }
    };
    el.addEventListener("click", preventClick, true);
    return () => el.removeEventListener("click", preventClick, true);
  }, []);

  return (
    <div className="flex w-full max-w-[1020px] overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-900/95 shadow-2xl backdrop-blur-xl">
      {/* Painel esquerdo: largura fixa para que a direita tenha 708px+ para 4 cards */}
      <div className="flex w-[260px] shrink-0 flex-col items-center justify-between border-r border-zinc-700/50 bg-zinc-800/80 p-5 sm:w-[272px]">
        <div className="flex flex-col items-center text-center">
          <h3 className="text-xl font-bold text-white sm:text-[22px]">Ofertas Exclusivas!</h3>
          <p className="mt-2 text-sm leading-snug text-zinc-300 sm:text-[15px]">
            Preços reduzidos por tempo limitado. Aproveite as melhores condições da loja.
          </p>
          <div className="mt-4 flex flex-col items-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-zinc-300">
              Termina em
            </p>
            <CountdownTimer dataFinal={dataFinal} variant="cyan" />
          </div>
        </div>
        <Link
          href="/#ofertas"
          onClick={onClose}
          className="mt-6 flex w-full max-w-[200px] items-center justify-center rounded-xl border-2 border-white/40 bg-transparent py-2.5 text-sm font-bold uppercase text-white transition-colors hover:border-white/60 hover:bg-white/10"
        >
          Ver todas as ofertas
        </Link>
      </div>

      {/* Painel direito: espaço para 4 cards (708px) + padding; min-width evita corte do 4º card */}
      <div className="flex min-w-0 flex-1 flex-col bg-white/95 lg:min-w-[740px]">
        <div className="border-b border-zinc-200 px-4 py-2.5">
          <p className="text-sm font-semibold text-zinc-700">Jogos em oferta</p>
        </div>
        <div className="overflow-hidden p-4">
          {produtos.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Nenhuma oferta no momento.</p>
          ) : (
            <div
              ref={scrollRef}
              className="scrollbar-hide flex cursor-grab select-none overflow-x-auto scroll-smooth active:cursor-grabbing"
              style={{
                width: MINI_VISIBLE_WIDTH,
                gap: MINI_GAP,
                boxShadow: "inset 8px 0 16px -8px rgba(0,0,0,0.12), inset -8px 0 16px -8px rgba(0,0,0,0.12)",
              }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseLeave}
            >
              {produtos.map((p) => (
                <MiniCard key={p.id ?? p.id_externo} produto={p} onClick={onClose ?? (() => {})} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
