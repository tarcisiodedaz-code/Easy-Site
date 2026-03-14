import Link from "next/link";
import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";
import { getLojaConfig } from "@/lib/loja-config";
import { getCategoriasProdutoParaMenu } from "@/lib/produtos-completo";

export default async function SobrePage() {
  const [logoMarca, categoriasMenu] = await Promise.all([
    getLojaConfig("logo_marca"),
    getCategoriasProdutoParaMenu(),
  ]);
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StoreHeader logoUrl={logoMarca?.url ?? null} categoriasMenu={categoriasMenu} />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-bold text-white">Sobre a loja</h1>
        <p className="mt-6 text-zinc-400 leading-relaxed">
          A Easy Games é uma loja 100% segura com o objetivo de atender todos os clientes de forma rápida e eficiente. 
          Trabalhamos com jogos digitais, pré-vendas e gift cards. Entre em contato pelo WhatsApp para dúvidas.
        </p>
        <Link href="/" className="mt-8 inline-block text-[var(--accent)] hover:underline">
          ← Voltar
        </Link>
      </main>
      <StoreFooter />
    </div>
  );
}
