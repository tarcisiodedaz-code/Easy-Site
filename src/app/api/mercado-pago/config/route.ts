import { NextResponse } from "next/server";
import { getMercadoPagoConfigPublic } from "@/lib/mercado-pago";

/**
 * Retorna apenas Public Key e sandbox para o frontend configurar o SDK do Mercado Pago.
 * Access Token nunca é exposto.
 */
export async function GET() {
  const config = await getMercadoPagoConfigPublic();
  return NextResponse.json(config);
}
