-- Customização da Loja: ícones de categorias e configurações de banners
-- Execute no SQL Editor do Supabase.

-- 1) Categorias: permitir ícone customizado (upload SVG/PNG)
alter table public.categorias
  add column if not exists icon_url text;

comment on column public.categorias.icon_url is 'URL do ícone enviado (Storage). Dimensão recomendada: 64x64px.';

-- 2) Tabela de configurações da loja (banners, etc.)
create table if not exists public.configuracoes_loja (
  chave text primary key,
  valor jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.configuracoes_loja enable row level security;

create policy "Leitura pública configuracoes_loja"
  on public.configuracoes_loja for select
  using (true);

grant select on public.configuracoes_loja to anon, authenticated;
grant all on public.configuracoes_loja to service_role;

-- Exemplo de estrutura em valor:
-- banner_principal: [ { "image": "https://...", "title": "...", "link": "..." } ]
-- banner_contagem:   { "imagem_fundo": "https://...", "data_lancamento": "2026-10-12T00:00:00", "titulo": "...", "subtitulo": "..." }

-- 3) Storage: crie um bucket no Dashboard do Supabase:
--    Nome: loja-assets
--    Public: sim (para exibir imagens na loja)
--    Depois, em Storage > Policies, adicione:
--    - Policy "Upload autenticado": INSERT para authenticated ou use Service Role no backend
--    - Policy "Leitura pública": SELECT para anon (para exibir imagens)
