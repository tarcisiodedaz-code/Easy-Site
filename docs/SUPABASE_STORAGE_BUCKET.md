# Bucket de Storage para a Loja (loja-assets)

O upload de **logo**, **favicon** e **banners** (incluindo banner principal e capa do jogo no banner de contagem) usa o bucket do Supabase Storage chamado **`loja-assets`**.

Se ao adicionar um banner ou fazer upload de logo aparecer **"Bucket not found"**, é porque esse bucket ainda não foi criado no seu projeto Supabase.

## Como criar o bucket

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard) e abra o seu projeto.
2. No menu lateral, clique em **Storage**.
3. Clique em **New bucket**.
4. Preencha:
   - **Name:** `loja-assets` (exatamente esse nome; o código usa essa constante).
   - **Public bucket:** marque como **público** para que as URLs das imagens (logo, favicon, banners) funcionem no site sem autenticação.
5. Clique em **Create bucket**.

Depois disso, os uploads em **Personalize sua Loja** (Logo e Banners) devem funcionar.

## Políticas (opcional)

Se o backend usar a **service role key** (como na API `/api/admin/upload`), o Supabase já permite que o service role faça upload. Para bucket público, a leitura pode ser feita por qualquer um (anon). Se precisar de políticas customizadas, use **Storage** → **Policies** no bucket `loja-assets`.
