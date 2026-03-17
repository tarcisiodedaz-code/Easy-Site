import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";
import { CarrinhoContent } from "./CarrinhoContent";

export default function CarrinhoPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StoreHeader />
      <main className="pt-[130px] pb-16 sm:pt-[140px] md:pt-[150px]">
        <CarrinhoContent />
      </main>
      <StoreFooter />
    </div>
  );
}
