import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";
import { CheckoutContent } from "./CheckoutContent";
import { getLojaConfig } from "@/lib/loja-config";
import { getCategoriasProdutoParaMenu } from "@/lib/produtos-completo";

export default async function CheckoutPage() {
  const [logoMarca, iconePix, iconeMercadoPago, categoriasMenu] = await Promise.all([
    getLojaConfig("logo_marca"),
    getLojaConfig("icone_pix"),
    getLojaConfig("icone_mercado_pago"),
    getCategoriasProdutoParaMenu(),
  ]);
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StoreHeader logoUrl={logoMarca?.url ?? null} categoriasMenu={categoriasMenu} />
      <main className="pt-[130px] pb-16 sm:pt-[140px] md:pt-[150px]">
        <CheckoutContent 
          iconePixUrl={iconePix?.url ?? null}
          iconeMercadoPagoUrl={iconeMercadoPago?.url ?? null}
        />
      </main>
      <StoreFooter />
    </div>
  );
}
