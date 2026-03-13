import { NextResponse } from "next/server";
import { getPaginasAtivas } from "@/lib/paginas";

export async function GET() {
  try {
    const paginas = await getPaginasAtivas();
    return NextResponse.json({ paginas });
  } catch (e) {
    console.error("Erro ao buscar páginas:", e);
    return NextResponse.json({ paginas: [], erro: "Erro interno" }, { status: 500 });
  }
}
