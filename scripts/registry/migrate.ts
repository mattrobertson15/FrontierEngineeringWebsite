/**
 * Applies db/migrations/*.sql in order and records them in benchmarks.schema_migrations.
 *
 * Kept separate from Supabase's own migration history (supabase_migrations) on purpose: the
 * registry may live inside a database another project manages with the Supabase CLI, and must
 * not add entries to its history. Each file runs in its own transaction; an applied file whose
 * contents later change is an error (write a new migration instead of editing an old one).
 *
 * Needs a privileged connection (creates the schema and roles), never the importer's role.
 */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type postgres from "postgres";

export const MIGRATIONS_DIR = resolve(import.meta.dirname, "../../db/migrations");

export async function migrate(sql: postgres.Sql, dir = MIGRATIONS_DIR): Promise<{ applied: string[]; skipped: string[] }> {
  const files = (await readdir(dir)).filter((f) => /^\d{4}_[a-z0-9_]+\.sql$/.test(f)).sort();
  const applied: string[] = [];
  const skipped: string[] = [];

  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext('benchmark-registry-migrate'))`;
    await tx.unsafe(`
      create schema if not exists benchmarks;
      create table if not exists benchmarks.schema_migrations (
        version text primary key,
        checksum text not null,
        applied_at timestamptz not null default now()
      );`);

    const done = new Map(
      (await tx`select version, checksum from benchmarks.schema_migrations`).map((r) => [r.version as string, r.checksum as string]),
    );
    for (const file of files) {
      const text = await readFile(join(dir, file), "utf8");
      const checksum = createHash("sha256").update(text).digest("hex");
      const version = file.replace(/\.sql$/, "");
      const prior = done.get(version);
      if (prior) {
        if (prior !== checksum) throw new Error(`${file} was edited after it was applied; add a new migration instead`);
        skipped.push(file);
        continue;
      }
      await tx.savepoint(async (sp) => {
        await sp.unsafe(text);
        await sp`insert into benchmarks.schema_migrations (version, checksum) values (${version}, ${checksum})`;
      });
      applied.push(file);
    }
  });
  return { applied, skipped };
}
