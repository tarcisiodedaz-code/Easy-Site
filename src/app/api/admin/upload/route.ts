import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { validateAdminSession } from "@/lib/auth-admin";

const BUCKET = "loja-assets";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];

export async function POST(request: Request) {
  const ok = await validateAdminSession();
  if (!ok) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "outros";

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ erro: "Nenhum arquivo enviado." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ erro: "Arquivo muito grande (máx. 5MB)." }, { status: 400 });
  }

  const isIco = file.name.toLowerCase().endsWith(".ico");
  if (!ALLOWED_TYPES.includes(file.type) && !isIco) {
    return NextResponse.json({
      erro: "Tipo não permitido. Use SVG, PNG, JPEG, WebP ou ICO (favicon).",
    }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    const admin = createAdminClient();
    const buf = Buffer.from(await file.arrayBuffer());
    const { error } = await admin.storage.from(BUCKET).upload(path, buf, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json(
        { erro: error.message || "Falha ao enviar arquivo. Verifique se o bucket 'loja-assets' existe e está público." },
        { status: 500 }
      );
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Erro interno ao fazer upload." }, { status: 500 });
  }
}
