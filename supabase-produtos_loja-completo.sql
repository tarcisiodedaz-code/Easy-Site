-- Estender produtos_loja e criar categorias de produto
-- Execute no SQL Editor do Supabase (após a tabela produtos_loja existir).

-- Categorias e subcategorias de produtos (ex: PS4, PS5, Lançamentos)
create table if not exists categorias_produto (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  parent_id uuid references categorias_produto(id) on delete set null,
  created_at timestamptz default now()
);

-- Novas colunas em produtos_loja (execute uma por vez se alguma já existir)
alter table produtos_loja add column if not exists descricao text;
alter table produtos_loja add column if not exists ativo boolean not null default true;
alter table produtos_loja add column if not exists visivel_site boolean not null default true;
alter table produtos_loja add column if not exists em_destaque boolean not null default false;
alter table produtos_loja add column if not exists preco_custo numeric(10, 2);
alter table produtos_loja add column if not exists preco_promocional numeric(10, 2);
alter table produtos_loja add column if not exists gerenciar_estoque boolean not null default false;
alter table produtos_loja add column if not exists quantidade_estoque int not null default 0;
alter table produtos_loja add column if not exists link_video text;
alter table produtos_loja add column if not exists slug text;
alter table produtos_loja add column if not exists categoria_id uuid references categorias_produto(id) on delete set null;
alter table produtos_loja add column if not exists subcategoria_id uuid references categorias_produto(id) on delete set null;

create unique index if not exists idx_produtos_loja_slug on produtos_loja(slug) where slug is not null;

-- Seed categorias (opcional; execute uma vez)
-- insert into categorias_produto (nome, parent_id) values ('PlayStation 4', null), ('PlayStation 5', null), ('Gift Card', null), ('Lançamentos', null);

-- Subcategorias (ex: sob Lançamentos)
-- insert into categorias_produto (nome, parent_id) select 'Pré-venda', id from categorias_produto where nome = 'Lançamentos' limit 1;

-- Storage: no Supabase Dashboard, crie um bucket "produtos" (público) para imagens.
-- Política: allow public read; allow authenticated or anon insert/update com RLS conforme sua necessidade.