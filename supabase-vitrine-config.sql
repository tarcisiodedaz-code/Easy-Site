-- Vitrine gerenciável: colunas em produtos_loja + tabela config_home
-- Execute no SQL Editor do Supabase.

-- Colunas em produtos_loja para vitrine
alter table produtos_loja add column if not exists is_lancamento boolean not null default false;
alter table produtos_loja add column if not exists is_mais_vendido boolean not null default false;

-- Tabela config_home: uma linha com as seções ativas (singleton)
create table if not exists public.config_home (
  id int primary key default 1 check (id = 1),
  mostrar_mais_vendidos boolean not null default true,
  mostrar_lancamentos boolean not null default true,
  mostrar_categorias boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Garantir que existe uma linha
insert into public.config_home (id, mostrar_mais_vendidos, mostrar_lancamentos, mostrar_categorias)
values (1, true, true, true)
on conflict (id) do nothing;

-- RLS: leitura pública para o site; escrita só via service role (admin)
alter table public.config_home enable row level security;

create policy "Leitura pública config_home"
  on public.config_home for select
  using (true);

-- Índices para consultas da vitrine
create index if not exists idx_produtos_loja_is_mais_vendido on produtos_loja (is_mais_vendido) where is_mais_vendido = true and deletado_em is null;
create index if not exists idx_produtos_loja_is_lancamento on produtos_loja (is_lancamento) where is_lancamento = true and deletado_em is null;

grant select on public.config_home to anon, authenticated;
grant all on public.config_home to service_role;
