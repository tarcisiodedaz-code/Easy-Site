import { NextResponse } from "next/server";
import { getLojaConfig } from "@/lib/loja-config";

export async function GET() {
  const config = await getLojaConfig("ofertas_especiais");
  return NextResponse.json(config ?? null);
}

