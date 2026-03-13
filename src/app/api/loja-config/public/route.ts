import { NextResponse } from "next/server";
import { getLojaConfig } from "@/lib/loja-config";

/** Configuração pública da loja (logo e favicon) para o header e layout. */
export async function GET() {
  const [logo_marca, favicon] = await Promise.all([
    getLojaConfig("logo_marca"),
    getLojaConfig("favicon"),
  ]);
  return NextResponse.json({
    logo_marca: logo_marca?.url ? { url: logo_marca.url } : null,
    favicon: favicon?.url ? { url: favicon.url } : null,
  });
}
