-- Adiciona coluna cliente_cpf na tabela pedidos (checkout Mercado Pago).
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_cpf TEXT;

-- Permite situacao 'rejeitado' (se a coluna for CHECK, ajuste conforme seu schema).
-- Se pedidos.situacao for enum, pode ser necessário: ALTER TYPE ... ADD VALUE 'rejeitado';
