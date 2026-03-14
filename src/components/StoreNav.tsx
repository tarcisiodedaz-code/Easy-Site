"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { getNavIcon } from "./NavIcons";
import { OfertasMegaMenuPanel } from "./OfertasMegaMenuPanel";
import type { CategoriaMenu } from "@/lib/produtos-completo";
import type { ProdutoLoja } from "@/lib/supabase";

const FALLBACK_MENU: CategoriaMenu[] = [
  { id: "gift-card", nome: "Gift Card", slug: "gift-card", href: "/categorias/gift-card", icon_url: null, filhos: [] },
  { id: "ps5", nome: "PlayStation 5", slug: "ps5", href: "/categorias/ps5", icon_url: null, filhos: [] },
  { id: "ps4", nome: "PlayStation 4", slug: "ps4", href: "/categorias/ps4", icon_url: null, filhos: [] },
  { id: "ofertas", nome: "Ofertas", slug: "ofertas", href: "/categorias/ofertas", icon_url: null, filhos: [] },
];

/** Subcategorias padrão do mega menu de Ofertas (quando não houver filhos no Supabase) */
const OFERTAS_SUBCATEGORIAS_PADRAO: { id: string; nome: string; href: string; icon: string }[] = [
  { id: "ofertas-ps4", nome: "Ofertas PS4", href: "/categorias/ps4", icon: "ps4" },
  { id: "ofertas-ps5", nome: "Ofertas PS5", href: "/categorias/ps5", icon: "ps5" },
  { id: "ofertas-gift", nome: "Gift Cards em Promoção", href: "/categorias/gift-card", icon: "giftcard" },
];

/** Retorna o ícone do NavIcons para uma subcategoria de ofertas (por slug ou nome) */
function getOfertaSubIcon(slug: string | null, nome: string): string {
  const s = (slug ?? "").toLowerCase();
  const n = nome.toLowerCase();
  if (s.includes("ps4") || n.includes("ps4")) return "ps4";
  if (s.includes("ps5") || n.includes("ps5")) return "ps5";
  if (s.includes("gift") || n.includes("gift") || n.includes("cartão")) return "giftcard";
  return "tag";
}

/** Ordem desejada: Gift Card, PlayStation 5, PlayStation 4, Ofertas (último à direita) */
const ORDEM_SLUGS = ["gift-card", "gift card", "playstation-5", "ps5", "playstation-4", "ps4", "ofertas"];
function ordenarMenu(itens: CategoriaMenu[]): CategoriaMenu[] {
  return [...itens].sort((a, b) => {
    const slugA = (a.slug ?? "").toLowerCase().trim();
    const slugB = (b.slug ?? "").toLowerCase().trim();
    const isOfertaA = slugA === "ofertas" || a.nome.toLowerCase().includes("oferta");
    const isOfertaB = slugB === "ofertas" || b.nome.toLowerCase().includes("oferta");
    if (isOfertaA && !isOfertaB) return 1;
    if (!isOfertaA && isOfertaB) return -1;
    if (isOfertaA && isOfertaB) return 0;
    const idxA = ORDEM_SLUGS.findIndex((s) => s !== "ofertas" && (slugA === s || slugA.includes(s)));
    const idxB = ORDEM_SLUGS.findIndex((s) => s !== "ofertas" && (slugB === s || slugB.includes(s)));
    const iA = idxA === -1 ? 999 : idxA;
    const iB = idxB === -1 ? 999 : idxB;
    return iA - iB;
  });
}

const DROPDOWN_CLOSE_DELAY_MS = 500;

type StoreNavProps = {
  categoriasIniciais?: CategoriaMenu[] | null;
};

export function StoreNav({ categoriasIniciais }: StoreNavProps = {}) {
  const [itens, setItens] = useState<CategoriaMenu[]>(
    categoriasIniciais ? ordenarMenu(categoriasIniciais) : []
  );
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [produtosOfertas, setProdutosOfertas] = useState<ProdutoLoja[]>([]);
  const [ofertasLoading, setOfertasLoading] = useState(false);
  const [ofertasDataFinal, setOfertasDataFinal] = useState<string | null>(null);
  const ofertasFetched = useRef(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleClose() {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setOpenIndex(null), DROPDOWN_CLOSE_DELAY_MS);
  }

  function cancelClose() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }

  useEffect(() => {
    if (categoriasIniciais) return;
    fetch("/api/categorias-menu")
      .then((r) => r.json())
      .then((data: CategoriaMenu[]) => setItens(ordenarMenu(data)))
      .catch(() => setItens(FALLBACK_MENU));
  }, [categoriasIniciais]);

  const menu = itens.length > 0 ? itens : FALLBACK_MENU;
  const ofertasIndex = menu.findIndex((m) => m.nome.toLowerCase().includes("oferta") || m.slug === "ofertas");
  const isOfertasOpen = openIndex === ofertasIndex && ofertasIndex >= 0;

  useEffect(() => {
    if (!isOfertasOpen || ofertasFetched.current) return;
    ofertasFetched.current = true;
    setOfertasLoading(true);
    Promise.all([
      fetch("/api/produtos-ofertas").then((r) => r.json()).catch(() => []),
      fetch("/api/ofertas-especiais-config").then((r) => r.json()).catch(() => null),
    ])
      .then(([produtos, config]) => {
        setProdutosOfertas(Array.isArray(produtos) ? produtos : []);
        if (config && typeof config === "object" && "dataFinal" in config) {
          setOfertasDataFinal((config as { dataFinal?: string }).dataFinal ?? null);
        } else {
          setOfertasDataFinal(null);
        }
      })
      .finally(() => setOfertasLoading(false));
  }, [isOfertasOpen]);

  return (
    <nav className="relative z-40 bg-zinc-950/90 backdrop-blur-xl">
      <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-2 py-3 sm:gap-4 sm:px-6 lg:px-8">
        {menu.map((item, index) => {
          const hasDropdown = item.filhos?.length > 0;
          const isOferta = item.nome.toLowerCase().includes("oferta") || item.slug === "ofertas";
          const showOfertasMega = isOferta;
          const showDropdown =
            openIndex === index &&
            (hasDropdown && !isOferta ? true : showOfertasMega);

          return (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={() => {
                cancelClose();
                if (hasDropdown || showOfertasMega) setOpenIndex(index);
              }}
              onMouseLeave={() => scheduleClose()}
            >
              <Link
                href={item.href}
                className={
                  isOferta
                    ? "offer-btn flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-800 px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(16,185,129,0.35)] transition-all duration-300 hover:from-emerald-400 hover:to-emerald-700 hover:shadow-[0_0_28px_rgba(16,185,129,0.45)] [&_svg]:text-white"
                    : `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800/80 [&_svg]:text-white`
                }
              >
                {/* Ícone: usa imagem customizada se disponível, senão usa ícone padrão */}
                {item.icon_url ? (
                  <img src={item.icon_url} alt="" className="h-7 w-7 object-contain" />
                ) : (
                  getNavIcon(isOferta ? "percent" : "pages")
                )}
                <span className="tracking-wide">{isOferta ? "OFERTAS ESPECIAS" : item.nome.toUpperCase()}</span>
                {(hasDropdown || showOfertasMega) && (
                  <svg className="h-3.5 w-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </Link>

              {/* Dropdown normal (outras categorias) */}
              {hasDropdown && !isOferta && showDropdown && (
                <div className="absolute left-0 top-full z-[100] mt-0.5 min-w-[200px] rounded-xl border border-zinc-700/80 bg-zinc-900/95 py-1 shadow-xl backdrop-blur-sm">
                  {item.filhos.map((sub) => (
                    <Link
                      key={sub.id}
                      href={sub.href}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                      onClick={() => setOpenIndex(null)}
                    >
                      {getNavIcon("pages")}
                      {sub.nome}
                    </Link>
                  ))}
                </div>
              )}

              {/* Mega Menu Ofertas: o painel é renderizado centralizado na barra (abaixo) */}
            </div>
          );
        })}

        {/* Mega Menu Dropdown - OFERTAS ESPECIAS: centralizado no meio da barra de categorias */}
        {isOfertasOpen && (
          <div
            className="absolute left-1/2 top-full z-[100] mt-1.5 -translate-x-1/2 shadow-[0_0_50px_rgba(16,185,129,0.12),0_12px_40px_rgba(0,0,0,0.5)]"
            onMouseEnter={cancelClose}
            onMouseLeave={() => scheduleClose()}
          >
            {ofertasLoading ? (
              <div className="flex h-[320px] w-[400px] items-center justify-center rounded-2xl border border-zinc-700/50 bg-zinc-900/95 backdrop-blur-xl">
                <p className="text-sm text-zinc-400">Carregando ofertas...</p>
              </div>
            ) : (
              <OfertasMegaMenuPanel
                produtos={produtosOfertas}
                dataFinalGlobal={ofertasDataFinal}
                onClose={() => setOpenIndex(null)}
              />
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
