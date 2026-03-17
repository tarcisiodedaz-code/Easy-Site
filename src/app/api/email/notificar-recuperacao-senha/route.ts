import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "Easy Games <onboarding@resend.dev>";
const BCC_ADMIN = process.env.EMAIL_BCC_ADMIN?.trim();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email as string;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: false, erro: "E-mail é obrigatório." }, { status: 400 });
    }

    if (!BCC_ADMIN) {
      return NextResponse.json({ ok: true });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY não definida; notificação de recuperação não enviada.");
      return NextResponse.json({ ok: true });
    }

    const { error } = await resend.emails.send({
      from: FROM,
      to: BCC_ADMIN,
      subject: "[Easy Games] Solicitação de redefinição de senha",
      html: `
        <p>Um cliente solicitou a redefinição de senha:</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p>O link de redefinição foi enviado pelo Supabase para a caixa de entrada do cliente.</p>
      `,
    });

    if (error) {
      console.error("Resend notificação recuperação:", error);
      return NextResponse.json({ ok: false, erro: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("API notificar-recuperacao-senha:", e);
    return NextResponse.json({ ok: false, erro: "Erro ao enviar notificação." }, { status: 500 });
  }
}
