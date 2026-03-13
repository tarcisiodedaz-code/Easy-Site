import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase-admin";

const resend = new Resend(process.env.RESEND_API_KEY || "re_build_placeholder");
const FROM = process.env.EMAIL_FROM ?? "Easy Games <onboarding@resend.dev>";
const BCC_ADMIN = process.env.EMAIL_BCC_ADMIN?.trim();
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easygames.store";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";

function buildRecoveryEmailHtml(actionLink: string): string {
  const fullLink = actionLink.startsWith("http") ? actionLink : `${SUPABASE_URL}/${actionLink}`;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir senha - Easy Games</title>
</head>
<body style="margin:0; padding:0; background-color:#0f0f0f; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f0f0f; min-height:100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 480px; background-color: #18181b; border-radius: 16px; border: 1px solid #27272a; overflow: hidden;">
          <tr>
            <td style="padding: 48px 40px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #fafafa; text-align: center; line-height: 1.3;">
                Esqueceu sua senha? Sem problemas!
              </h1>
              <p style="margin: 0 0 32px; font-size: 16px; color: #a1a1aa; text-align: center; line-height: 1.6;">
                Clique no botão abaixo para definir uma nova senha na Easy Games.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="${fullLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #fff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 10px; letter-spacing: 0.05em;">
                      REDEFINIR MINHA SENHA
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 13px; color: #71717a; text-align: center; line-height: 1.6;">
                Se você não solicitou esta alteração, pode ignorar este e-mail com segurança. Sua conta continua protegida na Easy Games.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY não definida.");
      return NextResponse.json(
        { ok: false, erro: "Serviço de e-mail não configurado. Configure RESEND_API_KEY no servidor (ex.: Vercel → Settings → Environment Variables)." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const email = (body?.email as string)?.trim();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: false, erro: "E-mail é obrigatório." }, { status: 400 });
    }

    let supabase;
    try {
      supabase = createAdminClient();
    } catch (adminErr) {
      console.error("createAdminClient:", adminErr);
      return NextResponse.json(
        { ok: false, erro: "Servidor não configurado. Verifique SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_URL nas variáveis de ambiente." },
        { status: 503 }
      );
    }

    const { data, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${SITE_URL}/redefinir-senha` },
    });

    if (linkError || !data?.properties?.action_link) {
      // Não revelar se o e-mail existe; sempre retornar sucesso
      return NextResponse.json({ ok: true });
    }

    const actionLink = data.properties.action_link;
    const bcc = BCC_ADMIN ? [BCC_ADMIN] : undefined;
    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to: email,
      bcc,
      subject: "Redefinir sua senha - Easy Games",
      html: buildRecoveryEmailHtml(actionLink),
    });

    if (sendError) {
      console.error("Resend recuperação senha:", sendError);
      return NextResponse.json(
        { ok: false, erro: sendError.message || "Falha ao enviar e-mail. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("API solicitar-redefinicao:", e);
    const message = e instanceof Error ? e.message : "Erro inesperado.";
    return NextResponse.json(
      { ok: false, erro: message || "Erro ao processar solicitação. Tente novamente." },
      { status: 500 }
    );
  }
}
