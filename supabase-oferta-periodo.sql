-- Colunas de período da oferta (início e fim) em produtos_loja
-- Execute no SQL Editor do Supabase se aparecer erro de coluna oferta_fim/oferta_inicio.

alter table produtos_loja
  add column if not exists oferta_inicio timestamptz;
alter table produtos_loja
  add column if not exists oferta_fim timestamptz;
