# Configuração de autenticação no Supabase (Easy Games)

Para que o cadastro na loja funcione como esperado (login automático, sem e-mail de confirmação do Supabase, e-mail de boas-vindas só via Resend), configure o projeto assim:

## 1. Desativar confirmação de e-mail

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard) e abra o projeto.
2. Vá em **Authentication** → **Providers** → **Email**.
3. Desmarque **"Confirm email"** (ou "Enable email confirmations").
4. Salve.

**Efeito:**  
- O Supabase deixa de enviar o e-mail de confirmação próprio.  
- Ao cadastrar, o usuário é criado já ativo e o `signUp` retorna sessão.  
- O app faz login automático, envia só o e-mail de boas-vindas (Resend) e redireciona para a Home.  
- O trigger `on_auth_user_created` continua criando o registro em `public.profiles`, e o cliente aparece em Admin → Clientes.

## 2. Usuário que já se cadastrou com confirmação ativa

Se alguém se cadastrou antes de desativar a confirmação:

1. No Supabase: **Authentication** → **Users**.
2. Localize o e-mail do usuário.
3. Abra o usuário e use **"Confirm user"** (ou "Confirmar usuário") para ativar a conta.
4. O cliente poderá fazer login na aba **Entrar** e passará a aparecer em Admin → Clientes (o profile já existe).

## 3. URLs de redirecionamento (recuperação de senha)

Em **Authentication** → **URL Configuration** → **Redirect URLs**, inclua:

- Produção: `https://SEU_DOMINIO/redefinir-senha`
- Desenvolvimento: `http://localhost:3000/redefinir-senha`

Assim o link “Esqueci minha senha” redireciona corretamente para a página de nova senha.

## 4. E-mail de recuperação de senha (personalizado)

O envio do link de “Esqueci minha senha” **não usa** o e-mail padrão do Supabase. A aplicação usa a API Admin do Supabase para gerar o link e envia um **e-mail personalizado via Resend** (template em dark mode, botão “REDEFINIR MINHA SENHA”, rodapé de segurança). Uma cópia é enviada em **BCC** para o e-mail administrativo (`EMAIL_BCC_ADMIN`). Não é necessário configurar ou desativar o template “Reset Password” no Supabase para esse fluxo.

## 5. Variáveis de ambiente

No `.env.local` (e em produção), defina:

- `NEXT_PUBLIC_SITE_URL` – URL base da loja (ex.: `https://easygames.store` ou `http://localhost:3000`) para os redirects.
- `NEXT_PUBLIC_SUPABASE_URL` – URL do projeto Supabase (já usada no front; a API de recuperação usa para montar o link no e-mail).
- `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_BCC_ADMIN` – para os e-mails (boas-vindas e recuperação de senha com BCC).

## 6. Login com Google (opcional)

Para o cliente poder **Entrar com Google** na loja:

1. No Supabase: **Authentication** → **Providers** → **Google** → ative e preencha **Client ID** e **Client Secret** (crie em [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth 2.0 Client ID → tipo “Web application”, URLs autorizadas: a origem do seu site e do Supabase).
2. Em **Authentication** → **URL Configuration** → **Redirect URLs**, adicione:
   - `http://localhost:3000/auth/callback`
   - `https://SEU_DOMINIO/auth/callback`
3. O botão “Entrar com Google” na página de login redireciona para o Google e, após autorizar, volta para `/auth/callback`, que troca o código pela sessão e redireciona o usuário (ex.: para o carrinho). O nome e o e-mail vêm do Google; telefone e CPF podem ser preenchidos no checkout.
