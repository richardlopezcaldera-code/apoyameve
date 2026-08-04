-- Emula lo que Supabase provee: roles, esquema auth, auth.uid(), auth.users.
create extension if not exists "pgcrypto";

-- Roles de PostgREST (sin login; los usa "set role")
do $$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin noinherit; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select from pg_roles where rolname='service_role') then create role service_role nologin noinherit bypassrls; end if;
end $$;
grant anon, authenticated, service_role to postgres;

create schema if not exists auth;

-- Tabla mínima de usuarios de Auth (sólo lo que usa el trigger)
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);

-- auth.uid(): en Supabase lee el JWT; aquí lo simulamos con una GUC de sesión.
create or replace function auth.uid() returns uuid
language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;

-- En Supabase las tablas nuevas de public quedan accesibles a anon/authenticated.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
grant usage on schema public to anon, authenticated;
-- Supabase concede usage sobre auth a estos roles (para usar auth.uid() en RLS)
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
