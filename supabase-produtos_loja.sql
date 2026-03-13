-- Tabela produtos_loja para a loja Easy Games
-- Execute este SQL no Supabase (SQL Editor) para criar a tabela.

create table if not exists produtos_loja (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  imagem_url text,
  preco_original numeric(10, 2) not null,
  preco numeric(10, 2) not null,
  id_externo text not null,
  url_origem text,
  created_at timestamptz default now(),
  constraint produtos_loja_id_externo_unique unique (id_externo)
);

-- Índice para buscas por id_externo (evitar duplicatas)
create index if not exists idx_produtos_loja_id_externo on produtos_loja (id_externo);

-- Habilitar RLS (Row Level Security) se quiser políticas por usuário depois
-- alter table produtos_loja enable row level security;
