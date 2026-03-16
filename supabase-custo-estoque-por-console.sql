-- Custo e quantidade de estoque por console (PS4 / PS5)
-- Execute no Supabase SQL Editor (após supabase-preco-promocional-por-console.sql se ainda não rodou)

ALTER TABLE produtos_loja
  ADD COLUMN IF NOT EXISTS preco_custo_ps4 numeric NULL,
  ADD COLUMN IF NOT EXISTS preco_custo_ps5 numeric NULL,
  ADD COLUMN IF NOT EXISTS quantidade_estoque_ps4 integer NULL,
  ADD COLUMN IF NOT EXISTS quantidade_estoque_ps5 integer NULL;

COMMENT ON COLUMN produtos_loja.preco_custo_ps4 IS 'Preço de custo das unidades PS4 (usado na importação Estoque → Loja)';
COMMENT ON COLUMN produtos_loja.preco_custo_ps5 IS 'Preço de custo das unidades PS5 (usado na importação Estoque → Loja)';
COMMENT ON COLUMN produtos_loja.quantidade_estoque_ps4 IS 'Quantidade em estoque para PS4';
COMMENT ON COLUMN produtos_loja.quantidade_estoque_ps5 IS 'Quantidade em estoque para PS5';
