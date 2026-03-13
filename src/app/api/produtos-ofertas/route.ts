import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { ProdutoLoja } from "@/lib/supabase";
import { getLojaConfig } from "@/lib/loja-config";

const MAX = 12;

function temOfertaValida(p: ProdutoLoja, agoraMs: number, fimPromocaoGlobal: number | null): boolean {
  const promo = p.preco_promocional;
  if (promo == null || Number(promo) <= 0) return false;
  // Se houver data final global de promoção, só considera ofertas até essa data.
  if (fimPromocaoGlobal != null && agoraMs > fimPromocaoGlobal) return false;
  return true;
}

export async function GET() {
  const ofertasConfig = await getLojaConfig("ofertas_especiais");
  const fimGlobalMs =
    ofertasConfig && ofertasConfig.dataFinal ? new Date(ofertasConfig.dataFinal).getTime() : null;
  const agoraMs = Date.now();

  const { data, error } = await supabase
    .from("produtos_loja")
    .select("*")
    .is("deletado_em", null)
    .not("preco_promocional", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Erro ao buscar produtos ofertas:", error);
    return NextResponse.json([]);
  }

  const list = (data ?? []) as ProdutoLoja[];
  const emOferta = list.filter((p) => temOfertaValida(p, agoraMs, fimGlobalMs)).slice(0, MAX);
  return NextResponse.json(emOferta);
}
