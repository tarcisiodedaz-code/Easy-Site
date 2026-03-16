-- Preço promocional por console (PS4 / PS5)
-- Execute no Supabase SQL Editor

ALTER TABLE produtos_loja
  ADD COLUMN IF NOT EXISTS preco_promocional_ps4 numeric NULL,
  ADD COLUMN IF NOT EXISTS preco_promocional_ps5 numeric NULL,
  ADD COLUMN IF NOT EXISTS usar_preco_promocional_por_console boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN produtos_loja.preco IS 'Preço de venda base (sempre para PS4 e PS5)';
COMMENT ON COLUMN produtos_loja.preco_promocional IS 'Preço promocional único (para os dois quando não usar por console)';
COMMENT ON COLUMN produtos_loja.preco_promocional_ps4 IS 'Preço promocional só para PS4';
COMMENT ON COLUMN produtos_loja.preco_promocional_ps5 IS 'Preço promocional só para PS5';
COMMENT ON COLUMN produtos_loja.usar_preco_promocional_por_console IS 'Se true, usa preco_promocional_ps4 e preco_promocional_ps5 em vez de preco_promocional';
