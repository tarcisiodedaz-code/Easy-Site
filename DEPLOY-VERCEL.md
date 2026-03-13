# Deploy na Vercel – Easy Games

## 1. Variáveis de ambiente (obrigatório)

No projeto na Vercel: **Settings → Environment Variables**. Adicione:

| Nome | Valor | Observação |
|------|--------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do seu projeto Supabase | Ex.: `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima (pública) do Supabase | Em Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key do Supabase | Só no servidor; não expor no cliente |
| `NEXT_PUBLIC_SITE_URL` | URL do site na Vercel | Ex.: `https://seu-projeto.vercel.app` |
| `ADMIN_PASSWORD` | Senha do painel admin | A que você usa em /admin/login |
| `ADMIN_SECRET` | Frase secreta do admin | Mesma do .env.local |

Para Mercado Pago e e-mail (opcional):

- `MERCADOPAGO_ACCESS_TOKEN` – para pagamentos
- `RESEND_API_KEY` ou `EMAIL_API_KEY` / `EMAIL_API_URL` – se usar e-mail

Marque as variáveis para **Production**, **Preview** e **Development** se quiser que valham em todos os ambientes.

---

## 2. Se o build falhar

- Confira o **log completo** do build na Vercel (role até o final e copie a mensagem de erro em vermelho).
- Garanta que todas as variáveis acima estão preenchidas (principalmente as `NEXT_PUBLIC_*` e Supabase).
- O repositório no GitHub deve ser o **Easy-Site** (ou o nome que você usa) com a pasta raiz sendo a do projeto (onde está `package.json` e `next.config.ts`). Não faça deploy a partir de uma subpasta (ex.: `easy-games`).

---

## 3. Depois do deploy

- Acesse `https://seu-projeto.vercel.app`
- Admin: `https://seu-projeto.vercel.app/admin`
- Atualize `NEXT_PUBLIC_SITE_URL` para a URL final do site (ex.: domínio customizado) quando for usar em produção.
