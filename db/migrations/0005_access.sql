-- Benchmark Intelligence Directory — roles, grants and row level security.
--
-- This registry may share a database with unrelated (and sensitive) data, so access is
-- least-privilege and scoped to the `benchmarks` schema:
--
--   benchmarks_writer   the importer. Read/write on benchmarks.*; nothing else.
--   benchmarks_reader   the website (server-side). Read-only on benchmarks.*; nothing else.
--
-- Both are NOLOGIN group roles. Create login roles that inherit them once per database, outside
-- migrations, so passwords never enter git (see research/README.md, "Database access"):
--
--   create role benchmarks_importer login password '…' in role benchmarks_writer;
--   create role benchmarks_site     login password '…' in role benchmarks_reader;
--
-- The schema is NOT added to Supabase's exposed API schemas, and the API roles (anon,
-- authenticated) get no grants on it. The importer additionally refuses to run if its role can
-- read any table outside this schema (scripts/registry/access.ts).

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'benchmarks_writer') then
    create role benchmarks_writer nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'benchmarks_reader') then
    create role benchmarks_reader nologin;
  end if;
end $$;

grant usage on schema benchmarks to benchmarks_writer, benchmarks_reader;

grant select, insert, update, delete on all tables in schema benchmarks to benchmarks_writer;
grant usage, select on all sequences in schema benchmarks to benchmarks_writer;
grant select on all tables in schema benchmarks to benchmarks_reader;

-- Objects created by later migrations get the same grants automatically.
alter default privileges in schema benchmarks grant select, insert, update, delete on tables to benchmarks_writer;
alter default privileges in schema benchmarks grant usage, select on sequences to benchmarks_writer;
alter default privileges in schema benchmarks grant select on tables to benchmarks_reader;

-- Supabase's API roles: explicitly nothing (no-ops where these roles don't exist, e.g. local tests).
do $$
declare
  r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on schema benchmarks from %I', r);
      execute format('revoke all on all tables in schema benchmarks from %I', r);
      execute format('revoke all on all sequences in schema benchmarks from %I', r);
      execute format('revoke all on all functions in schema benchmarks from %I', r);
    end if;
  end loop;
end $$;

-- Trigger functions run as the invoking role; nobody needs to call them directly.
revoke execute on all functions in schema benchmarks from public;

-- RLS on every table, with policies that name the two roles explicitly. Any other role
-- (other than the owner) sees and changes nothing, even if a grant is added by mistake.
do $$
declare
  t text;
begin
  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'benchmarks' and c.relkind = 'r'
  loop
    execute format('alter table benchmarks.%I enable row level security', t);
    execute format('create policy writer_all on benchmarks.%I for all to benchmarks_writer using (true) with check (true)', t);
    execute format('create policy reader_select on benchmarks.%I for select to benchmarks_reader using (true)', t);
  end loop;
end $$;
