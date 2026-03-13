-- Soft delete em produtos_loja + extensão de categorias_produto
-- Execute no SQL Editor do Supabase.

-- 1) Lixeira: produtos com deletado_em não são listados na loja nem na listagem "Listar Produtos"
alter table produtos_loja
  add column if not exists deletado_em timestamptz;

create index if not exists idx_produtos_loja_deletado_em on produtos_loja(deletado_em) where deletado_em is not null;

-- 2) Categorias de produto: campos para gestão no Admin (Nome, Descrição, Slug, Ativo, Ícone, Categoria Pai)
alter table categorias_produto add column if not exists descricao text;
alter table categorias_produto add column if not exists slug text;
alter table categorias_produto add column if not exists ativo boolean not null default true;
alter table categorias_produto add column if not exists icon_url text;

create unique index if not exists idx_categorias_produto_slug on categorias_produto(slug) where slug is not null;

-- 3) Importação: produtos novos ficam "Pendente de Info" até o admin editar
alter table produtos_loja
  add column if not exists pendente_info boolean not null default false;

-- 4) Histórico de custo: valor anterior antes de sobrescrever na importação
alter table produtos_loja
  add column if not exists preco_custo_anterior numeric(10, 2);

-- 5) Período da oferta: início e fim (exibir promoção só dentro do período)
alter table produtos_loja
  add column if not exists oferta_inicio timestamptz;
alter table produtos_loja
  add column if not exists oferta_fim timestamptz;
