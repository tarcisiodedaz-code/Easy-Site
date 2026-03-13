"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ProdutoCardV2 } from "./ProdutoCard";
import { CountdownTimer } from "./CountdownTimer";
import type { ProdutoLoja } from "@/lib/supabase";

const CARD_WIDTH = 218;
const GAP = 12;
const VISIBLE_WIDTH = CARD_WIDTH * 4 + GAP * 3; // 4 cards + 3 gaps
const AUTOPLAY_MS = 5000;

type OfertasImperdiveisCarouselProps = {
  produtos: ProdutoLoja[];
  dataFinalCountdown: string;
};

export function OfertasImperdiveisCarousel({ produtos, dataFinalCountdown }: OfertasImperdiveisCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const draggedRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || produtos.length === 0) return;
    const targetScroll = page * VISIBLE_WIDTH;
    const raf = requestAnimationFrame(() => {
      el.scrollTo({ left: targetScroll, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [page, produtos.length]);

  useEffect(() => {
    if (produtos.length <= 4) return;
    const id = setInterval(() => {
      setPage((p) => {
        const next = p + 1;
        const max = Math.ceil(produtos.length / 4);
        return next >= max ? 0 : next;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [produtos.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

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

  const onMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const onMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    const onGlobalMouseUp = () => {
      isDraggingRef.current = false;
    };
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

  if (produtos.length === 0) {
    return (
      <section id="ofertas" className="flex flex-col items-center justify-center px-3 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto w-full max-w-[1280px] rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-400">Nenhuma oferta no momento. Em breve!</p>
        </div>
      </section>
    );
  }

  return (
    <section id="ofertas" className="flex flex-col items-center justify-center px-3 py-10 sm:px-6 sm:py-14">
      <h2 className="mx-auto mb-6 w-full max-w-[1280px] text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Ofertas imperdíveis
      </h2>
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-center gap-6 lg:flex-row lg:items-stretch">
        {/* Bloco do cronômetro: centralizado vertical e horizontal, números com peso visual dos cards */}
        <div className="flex w-full shrink-0 flex-col items-center justify-center rounded-2xl bg-cyan-500/20 px-6 py-6 lg:w-64 lg:py-8">
          <p className="mb-1 text-center text-base font-bold uppercase tracking-wide text-cyan-200 sm:text-lg">
            Termina em
          </p>
          <p className="mb-4 text-center text-sm text-cyan-300/90">
            Aproveite antes que acabe
          </p>
          <div className="flex justify-center">
            <CountdownTimer dataFinal={dataFinalCountdown} variant="cyan" />
          </div>
          <a
            href="/#ofertas"
            className="mt-6 flex w-full max-w-[200px] items-center justify-center rounded-xl border-2 border-cyan-400/60 bg-cyan-500/20 py-2.5 text-sm font-bold uppercase text-white transition-colors hover:border-cyan-400 hover:bg-cyan-500/30"
          >
            Ver todas as ofertas
          </a>
        </div>
        {/* Carrossel: 4 cards 100% visíveis, sem scrollbar, transição suave */}
        <div className="relative w-full overflow-hidden lg:w-[908px]">
          <div
            ref={scrollRef}
            className="scrollbar-hide flex cursor-grab select-none overflow-x-auto scroll-smooth active:cursor-grabbing"
            style={{
              gap: GAP,
              boxShadow: "inset 12px 0 20px -12px rgba(0,0,0,0.25), inset -12px 0 20px -12px rgba(0,0,0,0.25)",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
          >
            {produtos.map((p) => (
              <div
                key={p.id ?? p.id_externo}
                className="shrink-0"
                style={{ width: CARD_WIDTH }}
              >
                <ProdutoCardV2 produto={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
