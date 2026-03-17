import Link from "next/link";
import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StoreHeader />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-bold text-white">Política de privacidade</h1>
        <p className="mt-6 text-zinc-400 leading-relaxed">
          Respeitamos sua privacidade. Os dados informados são utilizados apenas para processar pedidos e contato. 
          Não compartilhamos suas informações com terceiros.
        </p>
        <Link href="/" className="mt-8 inline-block text-[var(--accent)] hover:underline">
          ← Voltar
        </Link>
      </main>
      <StoreFooter />
    </div>
  );
}
