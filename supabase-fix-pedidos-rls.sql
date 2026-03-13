-- ============================================
-- CORRIGIR PERMISSÕES PARA CRIAR PEDIDOS
-- Execute no Supabase → SQL Editor
-- ============================================

-- 1) Desabilitar RLS temporariamente nas tabelas de pedidos
-- (ou criar políticas que permitam inserção)
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens DISABLE ROW LEVEL SECURITY;

-- 2) (Alternativa) Se quiser manter RLS, crie políticas:
-- CREATE POLICY "Permitir inserção de pedidos" ON pedidos
--   FOR INSERT TO anon, authenticated
--   WITH CHECK (true);
-- 
-- CREATE POLICY "Permitir inserção de itens" ON pedido_itens
--   FOR INSERT TO anon, authenticated
--   WITH CHECK (true);

-- 3) Garantir que as sequences funcionem
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4) Garantir permissões nas tabelas
GRANT SELECT, INSERT, UPDATE ON pedidos TO anon;
GRANT SELECT, INSERT, UPDATE ON pedidos TO authenticated;
GRANT SELECT, INSERT, UPDATE ON pedido_itens TO anon;
GRANT SELECT, INSERT, UPDATE ON pedido_itens TO authenticated;

-- 5) Se ainda não existir a coluna cliente_cpf
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_cpf TEXT;

-- 6) Atualizar check constraint para permitir mais formas de pagamento (opcional)
-- ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_forma_pagamento_check;
-- ALTER TABLE pedidos ADD CONSTRAINT pedidos_forma_pagamento_check 
--   CHECK (forma_pagamento IN ('pix', 'mercado_pago', 'credit_card'));
