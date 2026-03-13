import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";
import { CheckoutContent } from "./CheckoutContent";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <StoreHeader />
      <main className="pt-[130px] pb-16 sm:pt-[140px] md:pt-[150px]">
        <CheckoutContent />
      </main>
      <StoreFooter />
    </div>
  );
}
