-- Configurações da aparência da loja (editável pelo admin)
-- Execute no SQL Editor do Supabase

create table if not exists public.loja_config (
  chave text primary key,
  valor jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Políticas: leitura pública (loja), escrita só via service role ou auth admin
alter table public.loja_config enable row level security;

create policy "Leitura pública loja_config"
  on public.loja_config for select
  using (true);

-- Escrita: use Service Role Key no backend (admin) ao salvar configurações.

-- Valores iniciais (opcional)
insert into public.loja_config (chave, valor) values
  ('utility_bar', '[
    {"icon": "lock", "label": "LOJA SEGURA"},
    {"icon": "fast", "label": "ENVIO IMEDIATO"},
    {"icon": "controller", "label": "JOGOS DIGITAIS"}
  ]'::jsonb),
  ('carousel', '[
    {"image": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=85", "title": "Final Fantasy VII Rebirth", "link": "#ofertas"},
    {"image": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=85", "title": "Marvel''s Spider-Man 2", "link": "#ofertas"},
    {"image": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=1200&q=85", "title": "Tekken 8", "link": "#ofertas"}
  ]'::jsonb),
  ('pre_sale', '{"titulo": "PRÉ-VENDA: GTA VI", "subtitulo": "LANÇAMENTO EM", "dataFinal": "2026-09-17T00:00:00"}'::jsonb),
  ('nav_platforms', '[
    {"label": "PLAYSTATION 4", "href": "#ofertas", "icon": "ps4"},
    {"label": "PLAYSTATION 5", "href": "#ofertas", "icon": "ps5"},
    {"label": "GIFT CARD", "href": "#ofertas", "icon": "gift"},
    {"label": "OFERTA", "href": "#ofertas", "icon": "tag"}
  ]'::jsonb)
on conflict (chave) do update set valor = excluded.valor, updated_at = now();

-- Garantir permissões
grant select on public.loja_config to anon, authenticated;
grant all on public.loja_config to service_role;
