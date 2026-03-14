import { VitrineBase } from "./VitrineBase";
import type { ProdutoLoja } from "@/lib/supabase";

type Props = { produtos: ProdutoLoja[]; taxaCartao?: number };

export function VitrineDestaques({ produtos, taxaCartao }: Props) {
  return <VitrineBase titulo="⭐ DESTAQUES POR CATEGORIA" produtos={produtos} taxaCartao={taxaCartao} />;
}
