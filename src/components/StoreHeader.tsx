"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/browser";
import { StoreNav } from "./StoreNav";

const WHATSAPP_NUMERO = "5579999204322";
const WHATSAPP_MSG = "Olá! Vim pelo site e gostaria de mais informações.";

const SCROLL_THRESHOLD = 80;

function IconLupa() {
  return (
    <svg className="h-5 w-5 shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconAtendimento() {
  return (
    <svg className="h-9 w-9 shrink-0 text-white sm:h-10 sm:w-10" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg className="h-9 w-9 shrink-0 text-white sm:h-10 sm:w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function IconCarrinho() {
  return (
    <svg className="h-9 w-9 shrink-0 text-white sm:h-10 sm:w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  );
}

function IconJoystick({ compact }: { compact?: boolean }) {
  return (
    <svg 
      className={`shrink-0 transition-all duration-300 ${
        compact 
          ? "h-8 w-8 sm:h-9 sm:w-9" 
          : "h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14"
      }`} 
      viewBox="0 0 40 40" 
      fill="none" 
      aria-hidden
    >
      <path
        d="M20 4c-2 4-6 8-10 10 2 2 4 4 4 8 0 4-2 8-6 10 4-2 8-4 10-8 2 4 6 6 10 6 0-4 2-8 6-10-4-2-8-4-10-8 2-4 6-8 10-10z"
        fill="#22c55e"
      />
    </svg>
  );
}

function IconHamburger({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative h-5 w-5">
      <span
        className={`absolute left-0 block h-0.5 w-5 bg-white transition-all duration-300 ${
          isOpen ? "top-2 rotate-45" : "top-0.5"
        }`}
      />
      <span
        className={`absolute left-0 top-2 block h-0.5 w-5 bg-white transition-all duration-300 ${
          isOpen ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute left-0 block h-0.5 w-5 bg-white transition-all duration-300 ${
          isOpen ? "top-2 -rotate-45" : "top-3.5"
        }`}
      />
    </div>
  );
}

type PublicConfig = { logo_marca: { url: string } | null; favicon: { url: string } | null };

type CategoriaMenuSimples = {
  id: string;
  nome: string;
  slug: string | null;
  href: string;
  icon_url?: string | null;
  filhos: { id: string; nome: string; slug: string | null; href: string; icon_url?: string | null }[];
};

type StoreHeaderProps = {
  logoUrl?: string | null;
  categoriasMenu?: CategoriaMenuSimples[] | null;
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function StoreHeader({ logoUrl, categoriasMenu }: StoreHeaderProps = {}) {
  const { count, total } = useCart();
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; full_name?: string } | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [navForceOpen, setNavForceOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(
    logoUrl !== undefined ? { logo_marca: logoUrl ? { url: logoUrl } : null, favicon: null } : null
  );
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (logoUrl !== undefined) return;
    
    try {
      const cached = sessionStorage.getItem("loja_config_public");
      if (cached) {
        setPublicConfig(JSON.parse(cached) as PublicConfig);
      }
    } catch {}

    fetch("/api/loja-config/public")
      .then((r) => r.json())
      .then((data: PublicConfig) => {
        setPublicConfig(data);
        try {
          sessionStorage.setItem("loja_config_public", JSON.stringify(data));
        } catch {}
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleScroll() {
      const current = window.scrollY;
      const scrolledNow = current > SCROLL_THRESHOLD;
      setIsScrolled(scrolledNow);
      
      if (!scrolledNow) {
        setNavForceOpen(false);
      }
      
      lastScrollY.current = current;
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ? { email: u.email ?? "", full_name: u.user_metadata?.full_name } : null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { email: session.user.email ?? "", full_name: session.user.user_metadata?.full_name } : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    setUser(null);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/categorias/ofertas?q=${encodeURIComponent(q)}`);
    else router.push("/#ofertas");
  }

  function toggleNav() {
    setNavForceOpen((prev) => !prev);
  }

  const displayName = user?.full_name?.trim() || user?.email?.split("@")[0] || "Conta";

  // Logo fica compacta quando scrolled E menu não está aberto
  const isCompact = isScrolled && !navForceOpen;
  
  // Barra de navegação aparece se não está scrolled OU se o menu foi aberto manualmente
  const showNav = !isScrolled || navForceOpen;

  return (
    <header className="fixed left-0 right-0 top-0 z-50 w-full bg-zinc-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-5 sm:px-6">
        {/* Bloco esquerdo: Logo + Hamburger + Busca */}
        <div className="flex min-w-0 flex-1 items-center gap-6 sm:gap-8">
          {/* Logo com animação de tamanho */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90"
            aria-label="Easy Games - Início"
          >
            {publicConfig === null ? (
              <div
                className={`shrink-0 animate-pulse rounded bg-zinc-800 transition-all duration-300 ${
                  isCompact
                    ? "h-8 w-[100px] sm:h-9 sm:w-[120px]"
                    : "h-12 w-[140px] sm:h-14 sm:w-[180px] md:h-16 md:w-[220px]"
                }`}
                aria-hidden
              />
            ) : publicConfig.logo_marca?.url ? (
              <img
                src={publicConfig.logo_marca.url}
                alt="Easy Games"
                className={`w-auto object-contain object-left transition-all duration-300 ${
                  isCompact
                    ? "h-8 max-w-[120px] sm:h-9 sm:max-w-[140px]"
                    : "h-12 max-w-[220px] sm:h-14 sm:max-w-[280px] md:h-16 md:max-w-[320px]"
                }`}
                width={320}
                height={80}
              />
            ) : (
              <>
                <IconJoystick compact={isCompact} />
                <span className="flex flex-col leading-tight">
                  <span className={`font-bold text-white transition-all duration-300 ${
                    isCompact ? "text-lg sm:text-xl" : "text-2xl sm:text-2xl md:text-3xl"
                  }`}>EASY</span>
                  <span className={`font-bold text-white transition-all duration-300 ${
                    isCompact ? "text-lg sm:text-xl" : "text-2xl sm:text-2xl md:text-3xl"
                  }`}>GAMES</span>
                </span>
              </>
            )}
          </Link>

          {/* Botão Hamburger - aparece quando scrolled */}
          <button
            type="button"
            onClick={toggleNav}
            className={`flex items-center justify-center rounded-lg p-2 transition-all duration-300 hover:bg-zinc-800 ${
              isScrolled ? "scale-100 opacity-100" : "pointer-events-none w-0 scale-0 opacity-0"
            }`}
            aria-label={navForceOpen ? "Fechar menu" : "Abrir menu"}
          >
            <IconHamburger isOpen={navForceOpen} />
          </button>

          {/* Barra de busca - sem animação, como era antes */}
          <form
            onSubmit={handleSearch}
            className="flex min-w-0 flex-1 items-center sm:max-w-[580px] lg:max-w-[640px]"
          >
            <div className="flex w-full items-center gap-2 rounded-xl border border-zinc-600 bg-white py-2.5 pl-4 pr-3 shadow-sm">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite o que você procura"
                className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
                aria-label="Buscar"
              />
              <IconLupa />
            </div>
          </form>
        </div>

        {/* Bloco direito: Atendimento + Login + Carrinho */}
        <div className="flex shrink-0 items-center gap-4 sm:gap-6">
          <a
            href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MSG)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-800/80"
            title="Central de Atendimento"
          >
            <IconAtendimento />
            <span className="flex flex-col items-start text-left">
              <span className="text-xs leading-tight text-white">Central de</span>
              <span className="text-xs font-bold leading-tight text-white">Atendimento</span>
            </span>
          </a>

          {user ? (
            <div className="flex items-center gap-2 rounded-lg px-2 py-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 hover:opacity-90"
                title="Sair"
              >
                <IconUser />
                <span className="flex flex-col items-start text-left">
                  <span className="text-xs leading-tight text-white">Olá, {displayName}</span>
                  <span className="text-xs font-bold leading-tight text-white">Sair</span>
                </span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-800/80"
              title="Entrar ou Cadastrar-se"
            >
              <IconUser />
              <span className="flex flex-col items-start text-left">
                <span className="text-xs leading-tight text-white">Olá, Bem-vindo(a)</span>
                <span className="text-xs font-bold leading-tight text-white">Entre ou Cadastre-se</span>
              </span>
            </Link>
          )}

          <Link
            href="/carrinho"
            className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-800/80"
            aria-label="Meu Carrinho"
            title="Meu Carrinho"
          >
            <span className="relative shrink-0">
              <IconCarrinho />
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                {count > 99 ? "99+" : count}
              </span>
            </span>
            <span className="flex flex-col items-start text-left">
              <span className="text-xs font-bold leading-tight text-white">Meu Carrinho</span>
              <span className="text-xs leading-tight text-white">{formatBRL(total)}</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Navegação inferior (Gift Card, PlayStation 5, etc.) */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          showNav ? "max-h-20 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <StoreNav categoriasIniciais={categoriasMenu} />
      </div>
    </header>
  );
}
