-- Dashboard de Pedidos + Contas para entrega
-- Execute no SQL Editor do Supabase (após produtos_loja).

-- Situação: pendente | pago | cancelado | entregue
-- Forma de pagamento: mercado_pago | pix
create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  numero serial unique,
  cliente_nome text not null,
  cliente_email text not null,
  total numeric(10, 2) not null,
  situacao text not null default 'pendente' check (situacao in ('pendente', 'pago', 'cancelado', 'entregue')),
  forma_pagamento text not null check (forma_pagamento in ('mercado_pago', 'pix')),
  payment_id text,
  pix_txid text,
  email_enviado_em timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  produto_id uuid not null references produtos_loja(id),
  produto_nome text not null,
  preco_unitario numeric(10, 2) not null,
  quantidade int not null default 1,
  conta_entrega_id uuid,
  created_at timestamptz default now()
);

-- Contas filho por produto: atribuídas a pedido_itens via conta_entrega_id
create table if not exists contas_entrega (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references produtos_loja(id),
  email_conta text,
  senha_conta text,
  dados_extras text,
  usado boolean not null default false,
  created_at timestamptz default now()
);

alter table pedido_itens add constraint fk_conta_entrega
  foreign key (conta_entrega_id) references contas_entrega(id);

create index if not exists idx_pedidos_situacao on pedidos(situacao);
create index if not exists idx_pedidos_forma_pagamento on pedidos(forma_pagamento);
create index if not exists idx_pedidos_created_at on pedidos(created_at desc);
create index if not exists idx_pedido_itens_pedido_id on pedido_itens(pedido_id);
create index if not exists idx_contas_entrega_produto_usado on contas_entrega(produto_id, usado);

-- Trigger para updated_at
create or replace function atualizar_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists pedidos_updated_at on pedidos;
create trigger pedidos_updated_at
  before update on pedidos
  for each row execute function atualizar_updated_at();
