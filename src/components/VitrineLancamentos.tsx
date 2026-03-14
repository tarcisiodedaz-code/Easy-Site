import { VitrineBase } from "./VitrineBase";
import type { ProdutoLoja } from "@/lib/supabase";

type Props = { produtos: ProdutoLoja[]; taxaCartao?: number };

export function VitrineLancamentos({ produtos, taxaCartao }: Props) {
  return <VitrineBase titulo="✨ LANÇAMENTOS" produtos={produtos} taxaCartao={taxaCartao} />;
}
