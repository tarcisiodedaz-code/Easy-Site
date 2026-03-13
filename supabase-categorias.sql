-- Categorias do menu da loja (admin pode criar, editar e excluir)
-- Execute no SQL Editor do Supabase.

create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  href text,
  icon text,
  ordem int not null default 0,
  created_at timestamptz default now()
);

create table if not exists categoria_itens (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references categorias(id) on delete cascade,
  label text not null,
  href text not null,
  ordem int not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_categoria_itens_categoria_id on categoria_itens(categoria_id);

-- Seed opcional: descomente e execute uma vez para ter as categorias iniciais
/*
insert into categorias (nome, href, icon, ordem) values
  ('PÁGINAS', null, 'pages', 1),
  ('PRÉ-VENDA', '/#pre-venda', 'clock', 2),
  ('PLAYSTATION 4', null, 'ps4', 3),
  ('PLAYSTATION 5', null, 'ps5', 4),
  ('GIFT CARD', null, 'gift', 5),
  ('OFERTAS', null, 'tag', 6);
-- Depois insira os itens de cada categoria pelo admin ou manualmente.
*/
