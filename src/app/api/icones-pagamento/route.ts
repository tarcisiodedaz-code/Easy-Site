import { NextResponse } from "next/server";
import { getLojaConfig } from "@/lib/loja-config";

export async function GET() {
  try {
    const [pagbank, pix, ps4, ps5] = await Promise.all([
      getLojaConfig("icone_pagbank"),
      getLojaConfig("icone_pix"),
      getLojaConfig("icone_ps4"),
      getLojaConfig("icone_ps5"),
    ]);
    return NextResponse.json({
      pagbank: pagbank?.url ?? null,
      pix: pix?.url ?? null,
      ps4: ps4?.url ?? null,
      ps5: ps5?.url ?? null,
    });
  } catch {
    return NextResponse.json({ pagbank: null, pix: null, ps4: null, ps5: null });
  }
}
