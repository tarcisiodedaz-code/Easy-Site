import Link from "next/link";
import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";
import { FormRedefinirSenha } from "./FormRedefinirSenha";
import { getLojaConfig } from "@/lib/loja-config";
import { getCategoriasProdutoParaMenu } from "@/lib/produtos-completo";

export const metadata = {
  title: "Redefinir senha | Easy Games",
  description: "Digite sua nova senha.",
};

export default async function RedefinirSenhaPage() {
  const [logoMarca, categoriasMenu] = await Promise.all([
    getLojaConfig("logo_marca"),
    getCategoriasProdutoParaMenu(),
  ]);
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StoreHeader logoUrl={logoMarca?.url ?? null} categoriasMenu={categoriasMenu} />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-bold text-white">Nova senha</h1>
        <p className="mt-1 text-zinc-400">
          Digite e confirme sua nova senha. Depois você já entrará logado.
        </p>
        <FormRedefinirSenha />
        <p className="mt-6 text-center text-sm text-zinc-400">
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            ← Voltar ao login
          </Link>
        </p>
      </main>
      <StoreFooter />
    </div>
  );
}
