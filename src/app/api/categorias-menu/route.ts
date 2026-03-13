import { getCategoriasProdutoParaMenu } from "@/lib/produtos-completo";
import { NextResponse } from "next/server";

export async function GET() {
  const menu = await getCategoriasProdutoParaMenu();
  return NextResponse.json(menu);
}
