-- Script para adicionar campos de plataforma (PS4/PS5) na tabela produtos
-- Execute este script no Supabase SQL Editor

-- Adiciona campos de plataforma
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS disponivel_ps4 BOOLEAN DEFAULT true;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS disponivel_ps5 BOOLEAN DEFAULT true;

-- Atualiza todos os produtos existentes para ter ambas plataformas disponíveis
UPDATE produtos SET disponivel_ps4 = true, disponivel_ps5 = true WHERE disponivel_ps4 IS NULL OR disponivel_ps5 IS NULL;

-- Comentários para documentação
COMMENT ON COLUMN produtos.disponivel_ps4 IS 'Se true, o jogo está disponível para PlayStation 4';
COMMENT ON COLUMN produtos.disponivel_ps5 IS 'Se true, o jogo está disponível para PlayStation 5';
