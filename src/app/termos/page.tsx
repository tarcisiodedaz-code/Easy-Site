import Link from "next/link";
import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StoreHeader />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-bold text-white">Termos de uso</h1>
        <p className="mt-6 text-zinc-400 leading-relaxed">
          Ao utilizar este site, você concorda com nossos termos. Produtos digitais não possuem devolução após entrega do código/chave. 
          Em caso de dúvidas, entre em contato pelo WhatsApp.
        </p>
        <Link href="/" className="mt-8 inline-block text-[var(--accent)] hover:underline">
          ← Voltar
        </Link>
      </main>
      <StoreFooter />
    </div>
  );
}
