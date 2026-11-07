import "server-only";
import postgres from "postgres";

/**
 * Read-only connection to the benchmark registry (Supabase project "Benchmarks", schema `benchmarks`).
 *
 * The site connects as `benchmarks_site`, which inherits `benchmarks_reader`: SELECT on the
 * benchmarks schema and nothing else. Refusing any other role keeps an importer or admin URL
 * from ever being used by the website, even if it is pasted into the wrong variable.
 */
const SITE_ROLE = "benchmarks_site";

function connect() {
  const url = process.env.BENCHMARKS_SITE_DATABASE_URL;
  if (!url) {
    throw new Error("BENCHMARKS_SITE_DATABASE_URL is not set. See research/README.md, 'Database access'.");
  }
  // Supabase pooler usernames are "<role>.<project-ref>".
  const role = decodeURIComponent(new URL(url).username).split(".")[0];
  if (role !== SITE_ROLE) {
    throw new Error(`BENCHMARKS_SITE_DATABASE_URL must use the ${SITE_ROLE} role, not "${role}".`);
  }
  return postgres(url, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    connection: { application_name: "frontier-site" },
  });
}

const globalForDb = globalThis as typeof globalThis & { benchmarksSql?: postgres.Sql };

/** Lazily opened so that importing this module never needs the database. */
export function db() {
  globalForDb.benchmarksSql ??= connect();
  return globalForDb.benchmarksSql;
}
