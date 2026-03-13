import { NextResponse } from "next/server";
import { getLojaConfig } from "@/lib/loja-config";

export async function GET() {
  try {
    const config = await getLojaConfig("mercado_pago");
    const taxa = config?.taxaCartao ?? 5;
    return NextResponse.json({ taxa });
  } catch {
    return NextResponse.json({ taxa: 5 });
  }
}
