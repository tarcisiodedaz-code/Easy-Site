import { VitrineBase } from "./VitrineBase";
import type { ProdutoLoja } from "@/lib/supabase";

type Props = { produtos: ProdutoLoja[]; taxaCartao?: number };

export function VitrineMaisVendidos({ produtos, taxaCartao }: Props) {
  return <VitrineBase titulo="🔥 OS MAIS VENDIDOS" produtos={produtos} taxaCartao={taxaCartao} />;
}
