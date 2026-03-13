# Easy Games

Projeto Next.js com Tailwind CSS para a loja **Easy Games**.

## Configuração

1. **Dependências** (já instaladas):
   ```bash
   npm install
   ```

2. **Supabase**: copie `.env.local.example` para `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL` — URL do seu projeto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Chave anônima (pública)

3. **Tabela no Supabase**: execute o script `supabase-produtos_loja.sql` no **SQL Editor** do Supabase para criar a tabela `produtos_loja`.

## Rodar o projeto

**Importante:** use a pasta raiz do projeto (onde está o `package.json`), por exemplo:
`C:\Users\tarci\Documents\Easy Site`

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). A página de importação fica em **/admin/importar**.

**Se o site ficar só carregando:** confira se o arquivo `.env.local` está nessa mesma pasta e se tem `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` preenchidos. Se mudou de pasta, apague a pasta `.next` e rode `npm run dev` de novo.

## Funcionalidades

- **/admin/importar**: buscar ofertas (por enquanto com URL de exemplo e dados simulados), definir margem de lucro (%) e ver a tabela de conferência com imagem, preço original e novo preço.
- **Subir para minha Loja**: envia o produto para a tabela `produtos_loja` no Supabase. O sistema verifica por `id_externo` e não duplica se o jogo já existir.

## Próximos passos

- Trocar a lógica em `src/app/admin/importar/actions.ts` (função `buscarOfertas`) por um fetch/parser real do site de ofertas desejado.
- Ajustar `next.config.ts` (em `images.remotePatterns`) se usar imagens de outros domínios.
