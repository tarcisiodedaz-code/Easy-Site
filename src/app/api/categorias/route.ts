import { getCategorias } from "@/lib/categorias";
import { NextResponse } from "next/server";

export async function GET() {
  const categorias = await getCategorias();
  return NextResponse.json(categorias);
}
