-- Ordem das seções da vitrine na Home + remoção de "Navegue por categorias"
-- Execute no SQL Editor do Supabase (após supabase-vitrine-config.sql).

-- Coluna ordem_secoes: array com a ordem de exibição (lancamentos, mais_vendidos, destaque)
alter table public.config_home add column if not exists ordem_secoes jsonb not null default '["lancamentos", "mais_vendidos", "destaques"]'::jsonb;

-- Garantir valor padrão em linhas existentes
update public.config_home set ordem_secoes = '["lancamentos", "mais_vendidos", "destaques"]'::jsonb where ordem_secoes is null;
