-- Relação N:N produto ↔ categorias (um produto pode ter várias categorias/subcategorias)
-- Execute no SQL Editor do Supabase.

create table if not exists produto_categorias (
  produto_id uuid not null references produtos_loja(id) on delete cascade,
  categoria_id uuid not null references categorias_produto(id) on delete cascade,
  primary key (produto_id, categoria_id)
);

create index if not exists idx_produto_categorias_produto_id on produto_categorias(produto_id);
create index if not exists idx_produto_categorias_categoria_id on produto_categorias(categoria_id);

-- Migrar dados existentes: categoria_id e subcategoria_id de produtos_loja
insert into produto_categorias (produto_id, categoria_id)
select id, categoria_id from produtos_loja where categoria_id is not null
on conflict (produto_id, categoria_id) do nothing;

insert into produto_categorias (produto_id, categoria_id)
select id, subcategoria_id from produtos_loja where subcategoria_id is not null
on conflict (produto_id, categoria_id) do nothing;

-- Permissões (evita "permission denied for table produto_categorias")
GRANT ALL ON public.produto_categorias TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produto_categorias TO anon, authenticated;
