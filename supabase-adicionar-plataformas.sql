-- Script para adicionar campos de plataforma (PS4/PS5) na tabela produtos_loja
-- Execute este script no Supabase SQL Editor

-- Adiciona campos de plataforma
ALTER TABLE produtos_loja ADD COLUMN IF NOT EXISTS disponivel_ps4 BOOLEAN DEFAULT true;
ALTER TABLE produtos_loja ADD COLUMN IF NOT EXISTS disponivel_ps5 BOOLEAN DEFAULT true;

-- Atualiza todos os produtos existentes para ter ambas plataformas disponíveis
UPDATE produtos_loja SET disponivel_ps4 = true, disponivel_ps5 = true WHERE disponivel_ps4 IS NULL OR disponivel_ps5 IS NULL;

-- Comentários para documentação
COMMENT ON COLUMN produtos_loja.disponivel_ps4 IS 'Se true, o jogo está disponível para PlayStation 4';
COMMENT ON COLUMN produtos_loja.disponivel_ps5 IS 'Se true, o jogo está disponível para PlayStation 5';
