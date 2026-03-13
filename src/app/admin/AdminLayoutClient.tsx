"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

function LogoutButton() {
  const router = useRouter();
  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={handleLogout}
      className="mt-2 w-full rounded-lg px-3 py-2.5 text-left text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
    >
      Sair
    </button>
  );
}

const navLink = (path: string, pathname: string, label: string) => (
  <Link
    href={path}
    className={`block rounded-lg px-3 py-2.5 pl-8 text-sm font-medium transition-colors ${
      pathname === path ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
    }`}
  >
    {label}
  </Link>
);

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const isVendasRoute = pathname === "/admin/pedidos" || pathname === "/admin/customers";
  const isProdutosRoute =
    pathname === "/admin/produtos" ||
    pathname.startsWith("/admin/produtos/") ||
    pathname === "/admin/importar";
  const isPersonaliseRoute =
    pathname === "/admin/personalise" ||
    pathname.startsWith("/admin/personalise/") ||
    pathname === "/admin/vitrine";
  const isConfigRoute = pathname.startsWith("/admin/configuracoes");
  const [vendasAberto, setVendasAberto] = useState(isVendasRoute);
  const [produtosAberto, setProdutosAberto] = useState(isProdutosRoute);
  const [personaliseAberto, setPersonaliseAberto] = useState(isPersonaliseRoute);
  const [configAberto, setConfigAberto] = useState(isConfigRoute);

  useEffect(() => {
    if (isVendasRoute) setVendasAberto(true);
  }, [isVendasRoute]);
  useEffect(() => {
    if (isProdutosRoute) setProdutosAberto(true);
  }, [isProdutosRoute]);

  useEffect(() => {
    if (isPersonaliseRoute) setPersonaliseAberto(true);
  }, [isPersonaliseRoute]);
  useEffect(() => {
    if (isConfigRoute) setConfigAberto(true);
  }, [isConfigRoute]);

  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <aside className="fixed left-0 top-0 z-40 h-full w-56 border-r border-[var(--border)] bg-[var(--card)]">
        <div className="flex h-full flex-col p-4">
          <Link href="/admin" className="mb-8 text-lg font-bold tracking-tight text-white">
            Easy Games — Controle
          </Link>
          <nav className="flex flex-col gap-1">
            <Link
              href="/admin"
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname === "/admin" ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              Início
            </Link>
            {/* Categoria Vendas (expansível) */}
            <div className="flex flex-col gap-0">
              <button
                type="button"
                onClick={() => setVendasAberto((b) => !b)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  isVendasRoute ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <span>Vendas</span>
                <svg
                  className={`h-4 w-4 shrink-0 transition-transform ${vendasAberto ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {vendasAberto && (
                <div className="mt-0.5 flex flex-col gap-0">
                  {navLink("/admin/pedidos", pathname, "Lista de Pedidos")}
                  {navLink("/admin/customers", pathname, "Clientes")}
                </div>
              )}
            </div>
            {/* Categoria Produtos (expansível) */}
            <div className="flex flex-col gap-0">
              <button
                type="button"
                onClick={() => setProdutosAberto((b) => !b)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  isProdutosRoute ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <span>Produtos</span>
                <svg
                  className={`h-4 w-4 shrink-0 transition-transform ${produtosAberto ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {produtosAberto && (
                <div className="mt-0.5 flex flex-col gap-0">
                  {navLink("/admin/produtos", pathname, "Listar Produtos")}
                  {navLink("/admin/produtos/novo", pathname, "Criar Produto")}
                  {navLink("/admin/importar", pathname, "Importar ofertas")}
                  {navLink("/admin/produtos/categorias", pathname, "Categorias")}
                  {navLink("/admin/produtos/lixeira", pathname, "Lixeira")}
                </div>
              )}
            </div>
            {/* Categoria Personalize sua Loja (expansível, como Produtos) */}
            <div className="flex flex-col gap-0">
              <button
                type="button"
                onClick={() => setPersonaliseAberto((b) => !b)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  isPersonaliseRoute ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <span>Personalize sua Loja</span>
                <svg
                  className={`h-4 w-4 shrink-0 transition-transform ${personaliseAberto ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {personaliseAberto && (
                <div className="mt-0.5 flex flex-col gap-0">
                  {navLink("/admin/personalise", pathname, "Logo")}
                  {navLink("/admin/personalise/banners", pathname, "Banners")}
                  {navLink("/admin/vitrine", pathname, "Gerenciar Vitrine")}
                  {navLink("/admin/personalise/informacoes-adicionais", pathname, "Informações adicionais")}
                </div>
              )}
            </div>
            {/* Configurações */}
            <div className="flex flex-col gap-0">
              <button
                type="button"
                onClick={() => setConfigAberto((b) => !b)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  isConfigRoute ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <span>Configurações</span>
                <svg
                  className={`h-4 w-4 shrink-0 transition-transform ${configAberto ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {configAberto && (
                <div className="mt-0.5 flex flex-col gap-0">
                  {navLink("/admin/configuracoes/pagamentos", pathname, "Pagamentos")}
                  {navLink("/admin/configuracoes/paginas", pathname, "Páginas")}
                </div>
              )}
            </div>
          </nav>
          <div className="mt-auto border-t border-[var(--border)] pt-4">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              Ver loja →
            </Link>
            <LogoutButton />
          </div>
        </div>
      </aside>
      <main className="pl-56">{children}</main>
    </div>
  );
}
