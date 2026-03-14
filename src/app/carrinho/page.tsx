import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";
import { CarrinhoContent } from "./CarrinhoContent";
import { getLojaConfig } from "@/lib/loja-config";
import { getCategoriasProdutoParaMenu } from "@/lib/produtos-completo";

export default async function CarrinhoPage() {
  const [logoMarca, categoriasMenu] = await Promise.all([
    getLojaConfig("logo_marca"),
    getCategoriasProdutoParaMenu(),
  ]);
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StoreHeader logoUrl={logoMarca?.url ?? null} categoriasMenu={categoriasMenu} />
      <main className="pt-[130px] pb-16 sm:pt-[140px] md:pt-[150px]">
        <CarrinhoContent />
      </main>
      <StoreFooter />
    </div>
  );
}
