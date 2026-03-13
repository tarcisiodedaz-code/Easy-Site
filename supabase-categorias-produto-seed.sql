-- Seed: categorias pai PlayStation 4 e PlayStation 5 e suas subcategorias (gêneros)
-- Execute no SQL Editor do Supabase (após categorias_produto existir).
-- Execute uma vez; se já existirem as categorias pai, os INSERT das subcategorias usam os ids existentes.

-- 1) Inserir categorias pai se não existirem
insert into categorias_produto (nome, parent_id)
select n, null from (values ('PlayStation 4'), ('PlayStation 5')) as t(n)
where not exists (select 1 from categorias_produto c where c.parent_id is null and c.nome = t.n);

-- 2) Subcategorias sob PlayStation 4 (ordem: 1 a 10)
insert into categorias_produto (nome, parent_id)
select sub.nome, ps4.id
from categorias_produto ps4,
     (values
       ('Ação/Aventura', 1),
       ('Corrida', 2),
       ('Dança/Música', 3),
       ('Esportes', 4),
       ('Estratégia/RPG', 5),
       ('Infantil', 6),
       ('Luta/Combate', 7),
       ('Simulação', 8),
       ('Terror/Suspense', 9),
       ('Tiro/FPS', 10)
     ) as sub(nome, ordem)
where ps4.nome = 'PlayStation 4' and ps4.parent_id is null
  and not exists (
    select 1 from categorias_produto c
    where c.parent_id = ps4.id and c.nome = sub.nome
  );

-- 3) Mesmas subcategorias sob PlayStation 5
insert into categorias_produto (nome, parent_id)
select sub.nome, ps5.id
from categorias_produto ps5,
     (values
       ('Ação/Aventura', 1),
       ('Corrida', 2),
       ('Dança/Música', 3),
       ('Esportes', 4),
       ('Estratégia/RPG', 5),
       ('Infantil', 6),
       ('Luta/Combate', 7),
       ('Simulação', 8),
       ('Terror/Suspense', 9),
       ('Tiro/FPS', 10)
     ) as sub(nome, ordem)
where ps5.nome = 'PlayStation 5' and ps5.parent_id is null
  and not exists (
    select 1 from categorias_produto c
    where c.parent_id = ps5.id and c.nome = sub.nome
  );
