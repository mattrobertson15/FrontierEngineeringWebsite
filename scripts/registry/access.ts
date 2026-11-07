/**
 * Isolation guard. The registry can share a database with unrelated, sensitive data, so the
 * importer (and later the site) must connect as a role that can see the `benchmarks` schema and
 * nothing else. `assertIsolated` lists every table or view outside it that the current role can
 * read or write, and throws if there are any.
 *
 * Supabase/Postgres system schemas are ignored: their contents are managed by the platform and
 * the API roles, not by us.
 */
import type postgres from "postgres";

const SYSTEM_SCHEMAS = [
  "benchmarks",
  "pg_catalog",
  "information_schema",
  "extensions",
  "graphql",
  "graphql_public",
  "realtime",
  "storage",
  "auth",
  "vault",
  "net",
  "pgsodium",
  "pgsodium_masks",
  "supabase_functions",
  "supabase_migrations",
  "cron",
  "pgbouncer",
  "_realtime",
  "_analytics",
];

export async function reachableOutsideBenchmarks(sql: postgres.Sql): Promise<string[]> {
  const rows = await sql`
    select n.nspname || '.' || c.relname as name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind in ('r', 'v', 'm', 'p', 'f')
      and not (n.nspname = any(${SYSTEM_SCHEMAS}::text[]))
      and n.nspname not like 'pg\\_%'
      and (
        has_table_privilege(c.oid, 'SELECT') or has_table_privilege(c.oid, 'INSERT')
        or has_table_privilege(c.oid, 'UPDATE') or has_table_privilege(c.oid, 'DELETE')
      )
    order by 1`;
  return rows.map((r) => r.name as string);
}

export async function assertIsolated(sql: postgres.Sql) {
  const [{ role, superuser }] = await sql`
    select current_user as role, rolsuper as superuser from pg_roles where rolname = current_user`;
  if (superuser) {
    throw new Error(`connected as superuser "${role}"; use a login role that inherits benchmarks_writer (see research/README.md)`);
  }
  const reachable = await reachableOutsideBenchmarks(sql);
  if (reachable.length) {
    throw new Error(
      `role "${role}" can access tables outside the benchmarks schema, so it could touch unrelated data:\n` +
        reachable.map((t) => `  - ${t}`).join("\n") +
        "\nConnect as a role that only inherits benchmarks_writer.",
    );
  }
}
