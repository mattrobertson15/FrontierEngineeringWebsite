/**
 * Benchmark registry CLI.
 *
 *   npm run registry:validate              Check research/ against the contract. No database needed.
 *   npm run registry:manifest              Regenerate research/manifest.json from the files.
 *   npm run registry:migrate               Apply db/migrations (admin connection; run by a person, never in CI/Vercel).
 *   npm run registry:check-access          Show what the importer role can reach outside the benchmarks schema.
 *   npm run registry:import -- --dry-run   Validate, write inside a transaction, report, roll back.
 *   npm run registry:import                Validate and import. Requires research/ to be committed.
 *
 * Connections (server-side only; never NEXT_PUBLIC_*):
 *   BENCHMARKS_MIGRATION_URL   privileged (e.g. postgres) — migrate only.
 *   BENCHMARKS_DATABASE_URL    login role inheriting benchmarks_writer — import and check-access.
 */
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import postgres from "postgres";
import { assertIsolated, reachableOutsideBenchmarks } from "./access.ts";
import { buildManifest } from "./contract.ts";
import { loadResearch, ValidationError } from "./load.ts";
import { migrate } from "./migrate.ts";
import { importResearch } from "./write.ts";

const RESEARCH_DIR = resolve(import.meta.dirname, "../../research");

const git = (...args: string[]) => {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
};

function connect(envVar: string) {
  const url = process.env[envVar];
  if (!url) {
    console.error(`✗ ${envVar} is not set (see .env.example)`);
    process.exit(1);
  }
  return postgres(url, { max: 1, onnotice: () => {}, connection: { TimeZone: "UTC", application_name: "benchmark-registry" } });
}

async function main() {
  const [command, ...flags] = process.argv.slice(2);
  const has = (f: string) => flags.includes(f);

  if (command === "migrate") {
    const sql = connect("BENCHMARKS_MIGRATION_URL");
    try {
      const { applied, skipped } = await migrate(sql);
      console.log(`✓ migrations: ${applied.length} applied, ${skipped.length} already applied`);
      for (const f of applied) console.log(`  + ${f}`);
    } finally {
      await sql.end();
    }
    return;
  }

  if (command === "check-access") {
    const sql = connect("BENCHMARKS_DATABASE_URL");
    try {
      const [{ role }] = await sql`select current_user as role`;
      const reachable = await reachableOutsideBenchmarks(sql);
      if (reachable.length === 0) console.log(`✓ role "${role}" can reach nothing outside the benchmarks schema`);
      else {
        console.error(`✗ role "${role}" can reach:\n${reachable.map((t) => `  - ${t}`).join("\n")}`);
        process.exitCode = 1;
      }
    } finally {
      await sql.end();
    }
    return;
  }

  if (command === "manifest") {
    const bundle = await loadResearch(RESEARCH_DIR, { checkManifest: false });
    let meta = bundle.manifestMeta;
    try {
      const { readFile } = await import("node:fs/promises");
      const prior = JSON.parse(await readFile(join(RESEARCH_DIR, "manifest.json"), "utf8"));
      meta = { schema_version: prior.schema_version, research_date: prior.research_date, package_status: prior.package_status };
    } catch {
      // first manifest: defaults
    }
    await writeFile(join(RESEARCH_DIR, "manifest.json"), JSON.stringify(buildManifest(bundle.rows, meta), null, 2) + "\n");
    console.log("✓ research/manifest.json regenerated");
    return;
  }

  if (command !== "validate" && command !== "import") {
    console.error("usage: cli.ts validate | manifest | migrate | check-access | import [--dry-run] [--allow-dirty]");
    process.exit(2);
  }

  const bundle = await loadResearch(RESEARCH_DIR);
  const R = bundle.rows;
  const published = R.benchmarks.filter((b) => b.review_state === "published").length;
  console.log(
    `✓ research valid: ${R.benchmarks.length} registry entries (${published} published), ${R.versions.length} versions, ` +
      `${R.sources.length} sources, ${R.claims.length} claims, ${R.claim_evidence.length} evidence links, ${R.audits.length} audits, ` +
      `${R.research_gaps.length} gaps, ${bundle.runs.length} runs`,
  );
  if (command === "validate") return;

  const dryRun = has("--dry-run");
  const dirty = git("status", "--porcelain", "--", RESEARCH_DIR);
  if (!dryRun && dirty && !has("--allow-dirty")) {
    console.error("✗ research/ has uncommitted changes. Imports must come from reviewed, committed files.\n" + dirty);
    process.exit(1);
  }

  const sql = connect("BENCHMARKS_DATABASE_URL");
  try {
    await assertIsolated(sql);
    const head = git("rev-parse", "HEAD");
    const report = await importResearch(sql, bundle, { dryRun, gitCommit: dirty ? `${head}+dirty` : head });
    console.log(dryRun ? "Dry run — nothing was written. Would change:" : `✓ imported (ingestion job ${report.jobId})`);
    for (const [table, c] of Object.entries(report.counts).sort()) {
      const parts = Object.entries(c).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`);
      console.log(`  ${table.padEnd(26)} ${parts.join(", ")}`);
    }
    for (const w of report.warnings) console.warn(`  ! ${w}`);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e instanceof ValidationError ? `✗ ${e.message}` : `✗ ${(e as Error).message ?? e}`);
  process.exit(1);
});
