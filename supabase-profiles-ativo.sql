-- Campo ativo em profiles (desativar cliente impede uso da conta)
-- Execute no SQL Editor do Supabase.
-- Para bloquear login quando ativo = false, verifique profile.ativo após auth.getUser()
-- (ex.: no layout ou middleware) e chame signOut + redirect para /login se ativo for false.

alter table public.profiles
  add column if not exists ativo boolean not null default true;

comment on column public.profiles.ativo is 'Se false, o cliente não pode fazer login (bloqueado pelo admin).';
