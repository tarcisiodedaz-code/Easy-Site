-- Seed das categorias iniciais (execute DEPOIS de supabase-categorias.sql)
-- Execute no SQL Editor do Supabase.

insert into categorias (nome, href, icon, ordem) values
  ('PÁGINAS', null, 'pages', 1),
  ('PRÉ-VENDA', '/#pre-venda', 'clock', 2),
  ('PLAYSTATION 4', null, 'ps4', 3),
  ('PLAYSTATION 5', null, 'ps5', 4),
  ('GIFT CARD', null, 'gift', 5),
  ('OFERTAS', null, 'tag', 6);

-- Itens do dropdown PÁGINAS
insert into categoria_itens (categoria_id, label, href, ordem)
select id, 'Sobre a loja', '/sobre', 1 from categorias where nome = 'PÁGINAS' limit 1
union all select id, 'Termos de uso', '/termos', 2 from categorias where nome = 'PÁGINAS' limit 1
union all select id, 'Política de privacidade', '/privacidade', 3 from categorias where nome = 'PÁGINAS' limit 1
union all select id, 'Política de troca/devolução', '/trocas', 4 from categorias where nome = 'PÁGINAS' limit 1;

-- Itens PLAYSTATION 4
insert into categoria_itens (categoria_id, label, href, ordem)
select id, t.label, t.href, t.ordem from categorias,
(values ('Ação / Aventura', '/#ofertas', 1), ('Corrida', '/#ofertas', 2), ('Esportes', '/#ofertas', 3), ('Estratégia / RPG', '/#ofertas', 4), ('Tiro / FPS', '/#ofertas', 5)) as t(label, href, ordem)
where categorias.nome = 'PLAYSTATION 4' limit 1;

-- Itens PLAYSTATION 5
insert into categoria_itens (categoria_id, label, href, ordem)
select id, t.label, t.href, t.ordem from categorias,
(values ('Ação / Aventura', '/#ofertas', 1), ('Corrida', '/#ofertas', 2), ('Esportes', '/#ofertas', 3), ('Estratégia / RPG', '/#ofertas', 4), ('Tiro / FPS', '/#ofertas', 5)) as t(label, href, ordem)
where categorias.nome = 'PLAYSTATION 5' limit 1;

-- Itens GIFT CARD
insert into categoria_itens (categoria_id, label, href, ordem)
select id, t.label, t.href, t.ordem from categorias,
(values ('PlayStation', '/#ofertas', 1), ('Xbox', '/#ofertas', 2), ('Steam', '/#ofertas', 3), ('Netflix', '/#ofertas', 4), ('Battle.net', '/#ofertas', 5)) as t(label, href, ordem)
where categorias.nome = 'GIFT CARD' limit 1;

-- Itens OFERTAS
insert into categoria_itens (categoria_id, label, href, ordem)
select id, t.label, t.href, t.ordem from categorias,
(values ('10% OFF', '/#ofertas', 1), ('20% OFF', '/#ofertas', 2), ('30% OFF', '/#ofertas', 3), ('40% OFF', '/#ofertas', 4), ('50% OFF ou mais', '/#ofertas', 5)) as t(label, href, ordem)
where categorias.nome = 'OFERTAS' limit 1;
