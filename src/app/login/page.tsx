import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";
import { LoginForm } from "./LoginForm";
import { getLojaConfig } from "@/lib/loja-config";
import { getCategoriasProdutoParaMenu } from "@/lib/produtos-completo";

export const metadata = {
  title: "Entrar | Easy Games",
  description: "Faça login ou crie sua conta para continuar sua compra.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const [{ redirect: redir }, logoMarca, categoriasMenu] = await Promise.all([
    searchParams,
    getLojaConfig("logo_marca"),
    getCategoriasProdutoParaMenu(),
  ]);
  const redirect = redir;
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StoreHeader logoUrl={logoMarca?.url ?? null} categoriasMenu={categoriasMenu} />
      <main className="mx-auto max-w-md px-4 pt-[160px] pb-12 sm:pt-[180px]">
        <h1 className="text-2xl font-bold text-white">Entrar ou cadastrar</h1>
        <p className="mt-1 text-zinc-400">
          Para continuar sua compra, faça login ou crie uma conta.
        </p>
        <LoginForm redirect={redirect ?? "/carrinho"} />
      </main>
      <StoreFooter />
    </div>
  );
}
