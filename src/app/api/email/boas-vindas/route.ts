import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_build_placeholder");
const FROM = process.env.EMAIL_FROM ?? "Easy Games <onboarding@resend.dev>";
const BCC_ADMIN = process.env.EMAIL_BCC_ADMIN?.trim();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email as string;
    const full_name = (body?.full_name as string) || "Cliente";

    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: false, erro: "E-mail é obrigatório." }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY não definida; e-mail de boas-vindas não enviado.");
      return NextResponse.json({ ok: true });
    }

    const bcc = BCC_ADMIN ? [BCC_ADMIN] : undefined;

    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      bcc,
      subject: "Bem-vindo à Easy Games!",
      html: `
        <h1>Olá, ${full_name}!</h1>
        <p>Sua conta foi criada com sucesso na <strong>Easy Games</strong>.</p>
        <p>Agora você pode fazer login, adicionar jogos ao carrinho e finalizar suas compras com segurança.</p>
        <p>Qualquer dúvida, estamos à disposição.</p>
        <p>— Equipe Easy Games</p>
      `,
    });

    if (error) {
      console.error("Resend boas-vindas:", error);
      return NextResponse.json({ ok: false, erro: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("API boas-vindas:", e);
    return NextResponse.json({ ok: false, erro: "Erro ao enviar e-mail." }, { status: 500 });
  }
}
