import { NextResponse } from "next/server";
import { getLojaConfig } from "@/lib/loja-config";

export async function GET() {
  try {
    const [mercadoPago, pix, ps4, ps5] = await Promise.all([
      getLojaConfig("icone_mercado_pago"),
      getLojaConfig("icone_pix"),
      getLojaConfig("icone_ps4"),
      getLojaConfig("icone_ps5"),
    ]);
    return NextResponse.json({
      mercadoPago: mercadoPago?.url ?? null,
      pix: pix?.url ?? null,
      ps4: ps4?.url ?? null,
      ps5: ps5?.url ?? null,
    });
  } catch {
    return NextResponse.json({ mercadoPago: null, pix: null, ps4: null, ps5: null });
  }
}
