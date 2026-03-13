import Link from "next/link";
import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";
import { FormEsqueciSenha } from "./FormEsqueciSenha";

export const metadata = {
  title: "Esqueci minha senha | Easy Games",
  description: "Solicite o link para redefinir sua senha.",
};

export default function EsqueciSenhaPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StoreHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-bold text-white">Esqueci minha senha</h1>
        <p className="mt-1 text-zinc-400">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
        <FormEsqueciSenha />
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
