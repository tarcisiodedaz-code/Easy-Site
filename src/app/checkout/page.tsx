import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";
import { CheckoutContent } from "./CheckoutContent";
import { getLojaConfig } from "@/lib/loja-config";
import { getCategoriasProdutoParaMenu } from "@/lib/produtos-completo";
import { createClient } from "@/lib/supabase/server";

export default async function CheckoutPage() {
  const [logoMarca, iconePix, iconeMercadoPago, categoriasMenu, supabase] = await Promise.all([
    getLojaConfig("logo_marca"),
    getLojaConfig("icone_pix"),
    getLojaConfig("icone_mercado_pago"),
    getCategoriasProdutoParaMenu(),
    createClient(),
  ]);
  const { data: { user } } = await supabase.auth.getUser();
  const initialNome = (user?.user_metadata?.full_name as string | undefined)?.trim() ?? "";
  const initialEmail = (user?.email ?? "").trim();
  const initialTelefone = String((user?.user_metadata?.phone_number as string | undefined) ?? "")
    .replace(/\D/g, "")
    .slice(0, 13);
  const initialCpf = String((user?.user_metadata?.cpf as string | undefined) ?? "")
    .replace(/\D/g, "")
    .slice(0, 11);
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StoreHeader logoUrl={logoMarca?.url ?? null} categoriasMenu={categoriasMenu} />
      <main className="pt-[130px] pb-16 sm:pt-[140px] md:pt-[150px]">
        <CheckoutContent 
          iconePixUrl={iconePix?.url ?? null}
          iconeMercadoPagoUrl={iconeMercadoPago?.url ?? null}
          initialNome={initialNome}
          initialEmail={initialEmail}
          initialTelefone={initialTelefone}
          initialCpf={initialCpf}
        />
      </main>
      <StoreFooter />
    </div>
  );
}
