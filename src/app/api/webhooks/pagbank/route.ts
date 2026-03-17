import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getPagBankConfig } from "@/lib/pagbank";
import { createHash } from "crypto";

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

function validarAssinatura(rawBody: string, token: string, header: string | null): boolean {
  if (!header) return false;
  const expected = sha256Hex(`${token}-${rawBody}`);
  return header.toLowerCase() === expected.toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const sig = request.headers.get("x-authenticity-token");

    const cfg = await getPagBankConfig();
    const token = cfg?.token?.trim() || process.env.PAGBANK_TOKEN?.trim() || "";
    if (sig && token && !validarAssinatura(rawBody, token, sig)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const referenceId = typeof payload.reference_id === "string" ? payload.reference_id : undefined;
    const charges = payload.charges;

    if (!referenceId) return NextResponse.json({ ok: true });

    let status: string | undefined;
    if (Array.isArray(charges) && charges[0] && typeof charges[0] === "object") {
      const s = (charges[0] as Record<string, unknown>).status;
      if (typeof s === "string") status = s;
    }

    const situacao =
      status === "PAID" ? "pago" :
      status === "DECLINED" ? "rejeitado" :
      status === "CANCELED" ? "cancelado" :
      "pendente";

    const supabase = createAdminClient();
    await supabase.from("pedidos").update({ situacao }).eq("id", referenceId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook PagBank:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
