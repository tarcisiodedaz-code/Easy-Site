import { NextRequest, NextResponse } from "next/server";
import { setAdminSession } from "@/lib/auth-admin";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const senha = body.senha as string;
  if (senha !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, erro: "Senha incorreta." }, { status: 401 });
  }
  await setAdminSession();
  return NextResponse.json({ ok: true });
}
