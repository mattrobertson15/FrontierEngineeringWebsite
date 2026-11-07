/**
 * Registry tests: CSV contract, loader, migrations, importer and access isolation.
 *
 * Database tests need TEST_DATABASE_URL: a Postgres (15+) connection that may create and drop
 * databases and roles. Each test gets a fresh database with all migrations applied.
 *
 *   TEST_DATABASE_URL=postgres://postgres@127.0.0.1:54329/postgres npm run test:registry
 *
 * Without it, only the pure (no-database) tests run.
 */
import assert from "node:assert/strict";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { after, describe, test } from "node:test";
import postgres from "postgres";
import { assertIsolated } from "./access.ts";
import { buildManifest, canonicalJson, dbEnums, parseCsv, parsePartialDate, sha256Of, tableNames, tables, toCsv, type Column, type Row, type TableName } from "./contract.ts";
import { loadResearch, ValidationError, type Bundle } from "./load.ts";
import { migrate, MIGRATIONS_DIR } from "./migrate.ts";
import { importResearch } from "./write.ts";

const ADMIN_URL = process.env.TEST_DATABASE_URL;
const noDb = { skip: ADMIN_URL ? false : "TEST_DATABASE_URL not set" };

/* ---------------------------------------------------------------- fixtures */

type Research = Record<TableName, Row[]> & { runs: Record<string, unknown> };

function baseResearch(): Research {
  return {
    organizations: [
      { org_id: "frontier-engineering", name: "Frontier Engineering", type: "company", website: null },
      { org_id: "example-org", name: "Example Org", type: "academic", website: null },
      { org_id: "example-lab", name: "Example Lab", type: "lab", website: null },
      { org_id: "audit-org", name: "Audit Org", type: "nonprofit", website: null },
    ],
    capabilities: [
      { capability_id: "coding", axis: "capability", name: "Coding", description: null, parent_id: null },
      { capability_id: "repo-repair", axis: "capability", name: "Repo repair", description: null, parent_id: "coding" },
      { capability_id: "software-engineering", axis: "domain", name: "Software engineering", description: null, parent_id: null },
    ],
    licenses: [{ license_id: "mit", name: "MIT", spdx_id: "MIT", category: "permissive", url: null }],
    metric_definitions: [
      { metric_id: "pass_rate", scope: "evaluation", name: "Pass rate", unit: "percent", direction: "higher_is_better", aggregation: null, denominator: "planned attempts", description: null },
      { metric_id: "github_stars", scope: "engagement", name: "GitHub stars", unit: "count", direction: "neutral", aggregation: null, denominator: null, description: null },
    ],
    models: [{ model_id: "model-x", name: "Model X", provider_org_id: "example-lab", open_weights: null }],
    sources: [
      { source_id: "s_paper", url: "https://arxiv.org/abs/0000.00001", title: "Example paper", publisher: "Example Org", published_on: "2025-03-14", checked_on: "2026-11-01", source_kind: "primary", access_method: "web_text", locator: "Abstract", snapshot_path: null, content_hash: null },
      { source_id: "s_card", url: "https://example.org/model-x", title: "Model X card", publisher: "Example Lab", published_on: null, checked_on: "2026-11-01", source_kind: "primary", access_method: "web_text", locator: "Results table", snapshot_path: null, content_hash: null },
      { source_id: "s_audit", url: "https://example.org/audit", title: "Audit of ExampleBench", publisher: "Audit Org", published_on: "2026-01-10", checked_on: "2026-11-01", source_kind: "independent_audit", access_method: "web_text", locator: "Verdict", snapshot_path: null, content_hash: null },
    ],
    benchmarks: [
      { benchmark_id: "example-bench", slug: "example-bench", name: "ExampleBench", entity_kind: "benchmark", editorial_track: "coding", research_priority: "launch", summary: "Tests fixing real bugs.", primary_source_id: "s_paper", identity_status: "primary_source_located", profile_status: "pilot_draft", checked_on: "2026-11-01", notes: null, maintenance_status: null, review_state: "published", reviewed_on: "2026-11-02" },
      { benchmark_id: "parent-bench", slug: "parent-bench", name: "ParentBench", entity_kind: "benchmark_family", editorial_track: "coding", research_priority: "supporting", summary: "Parent family.", primary_source_id: "s_paper", identity_status: "primary_source_located", profile_status: "registry_only", checked_on: "2026-11-01", notes: null, maintenance_status: null, review_state: "draft", reviewed_on: null },
      { benchmark_id: "draft-bench", slug: "draft-bench", name: "DraftBench", entity_kind: "unclassified", editorial_track: null, research_priority: "backlog", summary: null, primary_source_id: null, identity_status: "not_checked", profile_status: "registry_only", checked_on: null, notes: null, maintenance_status: null, review_state: "draft", reviewed_on: null },
    ],
    benchmark_aliases: [{ alias: "ExBench", benchmark_id: "example-bench" }],
    benchmark_capabilities: [
      { benchmark_id: "example-bench", capability_id: "repo-repair", is_primary: true },
      { benchmark_id: "example-bench", capability_id: "software-engineering", is_primary: false },
    ],
    versions: [
      { version_id: "ex-v1", benchmark_id: "example-bench", version_label: "1.0", release_date: "2025-03-14", date_basis: "announcement", task_count: 500, source_id: "s_paper", revision_hash: null, pin_status: "label_only" },
      { version_id: "draft-v0", benchmark_id: "draft-bench", version_label: "0.1", release_date: null, date_basis: null, task_count: null, source_id: null, revision_hash: null, pin_status: "label_only" },
    ],
    splits: [{ split_id: "ex-v1-test", version_id: "ex-v1", name: "test", visibility: "public", task_count: 500, source_id: "s_paper" }],
    claims: [
      { claim_id: "c_1", benchmark_id: "example-bench", version_id: null, predicate: "scope_summary", value: "Tests fixing real bugs.", value_type: "text", unit: null, verification_status: "reported", checked_on: "2026-11-01", notes: null },
      { claim_id: "c_2", benchmark_id: "example-bench", version_id: "ex-v1", predicate: "task_count", value: "500", value_type: "number", unit: "tasks", verification_status: "reported", checked_on: "2026-11-01", notes: null },
      { claim_id: "c_3", benchmark_id: "example-bench", version_id: null, predicate: "human_baseline", value: "72", value_type: "number", unit: "percent", verification_status: "reported", checked_on: "2026-11-01", notes: null },
      { claim_id: "c_4", benchmark_id: "example-bench", version_id: "ex-v1", predicate: "audit_verdict", value: "Flawed", value_type: "text", unit: null, verification_status: "reported", checked_on: "2026-11-01", notes: "Auditor's verdict" },
      { claim_id: "c_5", benchmark_id: "example-bench", version_id: "ex-v1", predicate: "score_report", value: "Example Lab reported Model X", value_type: "text", unit: null, verification_status: "reported", checked_on: "2026-11-01", notes: null },
    ],
    claim_evidence: [
      { evidence_id: "e_1", claim_id: "c_1", source_id: "s_paper", locator: "Abstract", evidence_role: "supports", capture_kind: "paraphrase", excerpt: null },
      { evidence_id: "e_2", claim_id: "c_2", source_id: "s_paper", locator: "Table 1", evidence_role: "supports", capture_kind: "paraphrase", excerpt: null },
      { evidence_id: "e_3", claim_id: "c_3", source_id: "s_paper", locator: "Section 4", evidence_role: "supports", capture_kind: "quotation", excerpt: "Experts solved 72%." },
      { evidence_id: "e_4", claim_id: "c_4", source_id: "s_audit", locator: "Verdict", evidence_role: "supports", capture_kind: "paraphrase", excerpt: null },
      { evidence_id: "e_5", claim_id: "c_5", source_id: "s_card", locator: "Table 3", evidence_role: "supports", capture_kind: "paraphrase", excerpt: null },
    ],
    relationships: [{ relationship_id: "rel_1", from_benchmark_id: "example-bench", relationship_type: "variant_of", to_benchmark_id: "parent-bench", source_id: "s_paper" }],
    citations: [{ citation_id: "cit_1", benchmark_id: "example-bench", version_id: "ex-v1", citing_org_id: "example-lab", model_id: "model-x", citation_kind: "score_report", cited_on: "2026-05", claim_id: "c_5" }],
    result_observations: [
      { observation_id: "obs_1", benchmark_id: "example-bench", version_id: "ex-v1", source_id: "s_card", source_locator: "Card 1", model_label: "model-x", effort_label: "high", agent_label: "harness", score_percent: 74, interval_halfwidth_pp: 3, score_display: "74%±3%", average_cost_usd: 4.43, output_tokens_display: "30k", steps_display: "29", source_updated_on: "2026-09-22", observed_on: "2026-11-01", precision: "rounded_display", origin: "publisher_reported", comparison_status: "not_ready", missing_context: "Exact run configuration." },
    ],
    audits: [
      { audit_id: "a_1", benchmark_id: "example-bench", version_id: "ex-v1", auditor: "Audit Org", audit_date: "2026-01-10", verdict: "Flawed", affected_tasks_lower_bound: 12, review_task_count: 500, claim_id: "c_4", source_id: "s_audit", summary: "Lenient tests.", remediation_status: "not_checked" },
    ],
    metric_snapshots: [{ snapshot_id: "ms_1", benchmark_id: "example-bench", metric: "github_stars", value: 1900, value_display: "1.9k", precision: "rounded", source_id: "s_paper", observed_on: "2026-11-01" }],
    research_gaps: [{ gap_id: "gap_1", benchmark_id: "draft-bench", priority: "P0", gap_type: "identity", status: "open", next_action: "Find a primary source." }],
    runs: {},
  };
}

function exampleRun(overrides: Record<string, unknown> = {}) {
  return {
    contract: "frontier-run/v1",
    experiment_id: "fixture-example-bench-model-x-001",
    fixture: true,
    benchmark: { benchmark_id: "example-bench", version_id: "ex-v1", split_id: "ex-v1-test" },
    model: { model_id: "model-x", config: { reasoning_effort: "high" } },
    agent: { name: "test-harness", version: "1.0.0", tools: ["bash"] },
    environment: { image: "example/env:1" },
    protocol: { repetitions: 4, grader: "unit tests" },
    timestamps: { started_at: "2026-11-01T00:00:00Z", completed_at: "2026-11-01T05:00:00Z" },
    status: "completed",
    outcomes: [{ metric: "pass_rate", value: 71.2, unit: "percent", sample_size: 2000 }],
    usage: { attempts_planned: 2000, attempts_completed: 1990, api_cost_usd: 120.5, cost_coverage: 0.98, tokens: { input: 1000000, output: 50000 } },
    artifacts: [{ kind: "results", url: "s3://bucket/results.json", sha256: "a".repeat(64) }],
    ...overrides,
  };
}

const dirs: string[] = [];
after(async () => {
  for (const d of dirs) await rm(d, { recursive: true, force: true });
});

const META = { schema_version: "test", research_date: "2026-11-01", package_status: "test" };

async function writeResearch(r: Research, opts: { manifest?: boolean } = {}): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "research-"));
  dirs.push(dir);
  await mkdir(join(dir, "runs"));
  for (const t of tableNames) {
    const header = (tables[t].columns as Column[]).map((c) => c.name);
    await writeFile(join(dir, tables[t].file), toCsv(header, r[t]));
  }
  for (const [id, run] of Object.entries(r.runs)) await writeFile(join(dir, "runs", `${id}.json`), JSON.stringify(run));
  if (opts.manifest !== false) await writeFile(join(dir, "manifest.json"), JSON.stringify(buildManifest(r, META)));
  return dir;
}

const load = async (r: Research): Promise<Bundle> => loadResearch(await writeResearch(r));

async function expectProblems(r: Research | Promise<string>, ...fragments: string[]) {
  const dir = typeof (r as Promise<string>).then === "function" ? await (r as Promise<string>) : await writeResearch(r as Research);
  await assert.rejects(loadResearch(dir), (e: unknown) => {
    assert.ok(e instanceof ValidationError, String(e));
    for (const f of fragments) {
      assert.ok(e.problems.some((p) => p.includes(f)), `expected a problem mentioning "${f}", got:\n${e.problems.join("\n")}`);
    }
    return true;
  });
}

const find = <T extends TableName>(r: Research, t: T, col: string, value: string) => r[t].find((row) => row[col] === value)!;

/* ---------------------------------------------------------------- database helpers */

async function withDb(fn: (sql: postgres.Sql, dbUrl: string) => Promise<void>) {
  const name = `registry_test_${process.pid}_${Math.random().toString(36).slice(2, 8)}`;
  const admin = postgres(ADMIN_URL!, { max: 1, onnotice: () => {} });
  await admin.unsafe(`create database ${name}`);
  const url = new URL(ADMIN_URL!);
  url.pathname = `/${name}`;
  const sql = postgres(url.toString(), { max: 4, onnotice: () => {}, connection: { TimeZone: "UTC" } });
  try {
    await migrate(sql);
    await fn(sql, url.toString());
  } finally {
    await sql.end();
    await admin.unsafe(`drop database ${name} with (force)`);
    await admin.end();
  }
}

/** A throwaway login role (cluster-wide) that inherits `groupRole`; dropped afterwards. */
async function withLoginRole(sql: postgres.Sql, dbUrl: string, groupRole: string, fn: (as: postgres.Sql) => Promise<void>) {
  const role = `test_login_${Math.random().toString(36).slice(2, 8)}`;
  await sql.unsafe(`create role ${role} login in role ${groupRole}`);
  const url = new URL(dbUrl);
  url.username = role;
  url.password = "";
  const as = postgres(url.toString(), { max: 1, onnotice: () => {}, connection: { TimeZone: "UTC" } });
  try {
    await fn(as);
  } finally {
    await as.end();
    await sql.unsafe(`drop owned by ${role}; drop role ${role}`);
  }
}

/** Stand-in for the unrelated data the registry may share a database with. */
const addEmployeeTable = (sql: postgres.Sql) =>
  sql.unsafe(`create table public.employees (id int primary key, name text, salary numeric); insert into public.employees values (1, 'A', 1)`);

const count = async (sql: postgres.Sql, table: string) => Number((await sql`select count(*)::int as n from ${sql("benchmarks." + table)}`)[0].n);
const changes = (report: { counts: Record<string, Record<string, number>> }) =>
  Object.values(report.counts).reduce((n, c) => n + c.created + c.updated + c.retracted + c.removed, 0);

/* ---------------------------------------------------------------- pure tests */

describe("contract", () => {
  test("partial dates keep their precision and never invent a day", () => {
    assert.deepEqual(parsePartialDate("2025"), { date: "2025-01-01", precision: "year" });
    assert.deepEqual(parsePartialDate("2025-03"), { date: "2025-03-01", precision: "month" });
    assert.deepEqual(parsePartialDate("2025-03-14"), { date: "2025-03-14", precision: "day" });
  });

  test("canonical JSON is key-order independent, so config hashes are stable", () => {
    assert.equal(canonicalJson({ b: 1, a: { d: 2, c: 3 } }), canonicalJson({ a: { c: 3, d: 2 }, b: 1 }));
    assert.equal(sha256Of({ x: 1, y: [1, 2] }), sha256Of({ y: [1, 2], x: 1 }));
    assert.notEqual(sha256Of({ y: [1, 2] }), sha256Of({ y: [2, 1] }));
  });

  test("CSV round-trips quotes, commas, newlines, Unicode and NULLs", () => {
    const rows = [{ a: 'He said "hi", then left', b: "line one\nline two", c: "τ-bench" }, { a: null, b: "", c: "0" }];
    const text = toCsv(["a", "b", "c"], rows);
    assert.deepEqual(parseCsv(text), [["a", "b", "c"], ['He said "hi", then left', "line one\nline two", "τ-bench"], ["", "", "0"]]);
    assert.match(text, /^"a","b","c"\n/);
    assert.match(text, /\n,,"0"\n$/, "NULL is an empty unquoted cell; zero stays a value");
  });
});

describe("loader", () => {
  test("the fixture package is valid", async () => {
    const b = await load(baseResearch());
    assert.equal(b.rows.benchmarks.length, 3);
    assert.equal(b.rows.versions[0].task_count, 500);
    assert.equal(b.rows.benchmark_capabilities[0].is_primary, true);
  });

  test("the repository's research/ package is valid", async () => {
    const b = await loadResearch(resolve(import.meta.dirname, "../../research"));
    assert.ok(b.rows.benchmarks.length >= 36);
  });

  test("empty cells are NULL and zero is a value", async () => {
    const r = baseResearch();
    find(r, "metric_snapshots", "snapshot_id", "ms_1").value = 0;
    const b = await load(r);
    const draft = b.rows.versions.find((v) => v.version_id === "draft-v0")!;
    assert.equal(draft.task_count, null);
    assert.equal(draft.release_date, null);
    assert.equal(b.rows.metric_snapshots[0].value, 0);
  });

  test("a header that differs from the contract is rejected", async () => {
    const dir = await writeResearch(baseResearch());
    const file = join(dir, "versions.csv");
    await writeFile(file, (await readFile(file, "utf8")).replace('"task_count"', '"tasks"'));
    await expectProblems(Promise.resolve(dir), "research/versions.csv: header must be exactly");
  });

  test("a claim without supporting evidence is rejected", async () => {
    const r = baseResearch();
    r.claim_evidence = r.claim_evidence.filter((e) => e.claim_id !== "c_3");
    await expectProblems(r, "claim c_3 has no supporting evidence");
  });

  test("a version must belong to the same benchmark as the row naming it", async () => {
    const r = baseResearch();
    find(r, "claims", "claim_id", "c_3").version_id = "draft-v0";
    await expectProblems(r, "version draft-v0 belongs to draft-bench, not example-bench");
  });

  test("a version task_count must agree with an explicit task_count claim", async () => {
    const r = baseResearch();
    find(r, "versions", "version_id", "ex-v1").task_count = 480;
    await expectProblems(r, "task_count 480 disagrees with claim c_2 (500)");
  });

  test("dangling references and bad cells are reported with file and line", async () => {
    const r = baseResearch();
    find(r, "benchmark_capabilities", "capability_id", "repo-repair").capability_id = "nope";
    find(r, "audits", "audit_id", "a_1").claim_id = "c_missing";
    find(r, "versions", "version_id", "ex-v1").release_date = "14/03/2025";
    await expectProblems(r, 'capability_id "nope" has no row in capabilities.csv', 'claim_id "c_missing" has no row in claims.csv', "research/versions.csv:2: release_date");
  });

  test("published entries cannot have open P0 research gaps", async () => {
    const r = baseResearch();
    find(r, "research_gaps", "gap_id", "gap_1").benchmark_id = "example-bench";
    await expectProblems(r, "published entries cannot have open P0 research gaps");
  });

  test("a maintenance status needs a sourced maintenance claim", async () => {
    const r = baseResearch();
    find(r, "benchmarks", "benchmark_id", "parent-bench").maintenance_status = "unmaintained";
    await expectProblems(r, 'maintenance_status "unmaintained" needs a maintenance_notice');
  });

  test("an audit's verdict must match its claim", async () => {
    const r = baseResearch();
    find(r, "audits", "audit_id", "a_1").verdict = "Verified";
    await expectProblems(r, 'verdict "Verified" differs from claim c_4');
  });

  test("names and aliases must resolve to exactly one entry", async () => {
    const r = baseResearch();
    r.benchmark_aliases.push({ alias: "draftbench", benchmark_id: "example-bench" });
    await expectProblems(r, '"draftbench" already names draft-bench');
  });

  test("a stale manifest is rejected", async () => {
    const r = baseResearch();
    const dir = await writeResearch(r);
    r.research_gaps.push({ gap_id: "gap_2", benchmark_id: "draft-bench", priority: "P1", gap_type: "x", status: "open", next_action: "y" });
    await writeFile(join(dir, "research_gaps.csv"), toCsv((tables.research_gaps.columns as Column[]).map((c) => c.name), r.research_gaps));
    await expectProblems(Promise.resolve(dir), "manifest.json is out of date");
  });

  test("runs must reference an existing version, split, model and evaluation metric", async () => {
    const r = baseResearch();
    r.runs["bad"] = exampleRun({ benchmark: { benchmark_id: "example-bench", version_id: "ex-v1", split_id: "nope" }, outcomes: [{ metric: "github_stars", value: 1, unit: "count" }] });
    await expectProblems(r, 'unknown split_id "nope"', 'metric "github_stars" is not an evaluation metric');
  });
});

/* ---------------------------------------------------------------- database tests */

describe("migrations", () => {
  test("every table has row level security enabled", noDb, () =>
    withDb(async (sql) => {
      const open = await sql`select tablename from pg_tables where schemaname = 'benchmarks' and not rowsecurity`;
      assert.deepEqual(open.map((r) => r.tablename), []);
      const unpoliced = await sql`
        select t.tablename from pg_tables t where t.schemaname = 'benchmarks'
          and (select count(*) from pg_policies p where p.schemaname = 'benchmarks' and p.tablename = t.tablename) < 2`;
      assert.deepEqual(unpoliced.map((r) => r.tablename), []);
    }));

  test("TypeScript enum lists match the database enums", noDb, () =>
    withDb(async (sql) => {
      const rows = await sql`
        select t.typname, array_agg(e.enumlabel order by e.enumsortorder) as labels
        from pg_type t join pg_enum e on e.enumtypid = t.oid join pg_namespace n on n.oid = t.typnamespace
        where n.nspname = 'benchmarks' group by t.typname`;
      const db = Object.fromEntries(rows.map((r) => [r.typname, r.labels]));
      for (const [name, labels] of Object.entries(dbEnums)) assert.deepEqual(db[name], [...labels], `enum ${name} drifted`);
    }));
});

describe("import", () => {
  test("imports everything, and a second import changes nothing", noDb, () =>
    withDb(async (sql) => {
      const bundle = await load(baseResearch());
      const first = await importResearch(sql, bundle, { gitCommit: "abc123" });
      assert.equal(first.counts.benchmark_families.created, 3);
      // 5 explicit + released_on (version) + task_count (split) + relationship; c_2 backs the version task_count.
      assert.equal(await count(sql, "claims"), 8);
      assert.equal(await count(sql, "benchmark_citations"), 1);

      const historyBefore = await count(sql, "row_history");
      const eventsBefore = await count(sql, "review_events");
      const second = await importResearch(sql, bundle, { gitCommit: "abc123" });
      assert.equal(changes(second), 0, `second import changed rows: ${JSON.stringify(second.counts)}`);
      assert.equal(await count(sql, "row_history"), historyBefore);
      assert.equal(await count(sql, "review_events"), eventsBefore);

      const jobs = await sql`select status, git_commit from benchmarks.ingestion_jobs order by id`;
      assert.deepEqual(jobs.map((j) => [j.status, j.git_commit]), [["succeeded", "abc123"], ["succeeded", "abc123"]]);
      assert.equal((await sql`select * from benchmarks.unsupported_facts`).length, 0);
    }));

  test("research ids, attribution and precision survive the import", noDb, () =>
    withDb(async (sql) => {
      await importResearch(sql, await load(baseResearch()));
      const [snap] = await sql`select retrieved_on::text, retrieved_at, adapter from benchmarks.source_snapshots s join benchmarks.sources so on so.id = s.source_id where so.key = 's_paper'`;
      assert.deepEqual([snap.retrieved_on, snap.retrieved_at, snap.adapter], ["2026-11-01", null, "web_text"], "a retrieval date never gains an invented time");
      const [src] = await sql`select kind, provenance, publisher_name, publisher_id is not null as linked from benchmarks.sources where key = 's_audit'`;
      assert.deepEqual([src.kind, src.provenance, src.publisher_name, src.linked], [null, "independent_audit", "Audit Org", true]);
      const [audit] = await sql`select auditor_name, auditor_id is not null as linked, verdict, affected_tasks_lower_bound, review_task_count, remediation_status from benchmarks.benchmark_audits`;
      assert.deepEqual({ ...audit }, { auditor_name: "Audit Org", linked: true, verdict: "Flawed", affected_tasks_lower_bound: 12, review_task_count: 500, remediation_status: "not_checked" });
      const [stars] = await sql`select value::float as value, value_display, precision from benchmarks.metric_snapshots`;
      assert.deepEqual({ ...stars }, { value: 1900, value_display: "1.9k", precision: "rounded" });
      const [obs] = await sql`select comparison_status, score_percent::float as score from benchmarks.result_observations`;
      assert.deepEqual([obs.comparison_status, obs.score], ["not_ready", 74]);
      const [rel] = await sql`select r.research_id, c.field, c.review_state from benchmarks.benchmark_relationships r join benchmarks.claims c on c.id = r.claim_id`;
      assert.deepEqual([rel.research_id, rel.field, rel.review_state], ["rel_1", "relationship", "published"]);
      const [ev] = await sql`select capture_kind, excerpt from benchmarks.claim_evidence where research_id = 'e_3'`;
      assert.deepEqual([ev.capture_kind, ev.excerpt], ["quotation", "Experts solved 72%."]);
    }));

  test("unknown values stay NULL in the database", noDb, () =>
    withDb(async (sql) => {
      await importResearch(sql, await load(baseResearch()));
      const [f] = await sql`select maintainer_id, summary, primary_source_id, checked_on, editorial_track from benchmarks.benchmark_families where research_id = 'draft-bench'`;
      assert.deepEqual(Object.values(f), [null, null, null, null, null]);
      const [v] = await sql`select released_on, released_precision, task_count from benchmarks.benchmark_versions where research_id = 'draft-v0'`;
      assert.deepEqual(Object.values(v), [null, null, null]);
      const [{ n }] = await sql`select count(*)::int as n from benchmarks.claims c join benchmarks.benchmark_families f on f.id = c.subject_id where f.research_id = 'draft-bench'`;
      assert.equal(n, 0);
    }));

  test("dry run reports changes and writes nothing", noDb, () =>
    withDb(async (sql) => {
      const report = await importResearch(sql, await load(baseResearch()), { dryRun: true });
      assert.ok(changes(report) > 0);
      assert.equal(await count(sql, "benchmark_families"), 0);
      assert.equal(await count(sql, "ingestion_jobs"), 0);
    }));

  test("corrections keep history, and removed claims are retracted, not deleted", noDb, () =>
    withDb(async (sql) => {
      const r = baseResearch();
      await importResearch(sql, await load(r));

      find(r, "versions", "version_id", "ex-v1").task_count = 499;
      find(r, "claims", "claim_id", "c_2").value = "499";
      r.claims = r.claims.filter((c) => c.claim_id !== "c_3");
      r.claim_evidence = r.claim_evidence.filter((e) => e.claim_id !== "c_3");
      r.research_gaps = [];
      const report = await importResearch(sql, await load(r));

      assert.equal(report.counts.claims.retracted, 1);
      assert.equal(report.counts.research_gaps.removed, 1);
      const [claim] = await sql`select review_state from benchmarks.claims where key = 'research:c_3'`;
      assert.equal(claim.review_state, "retracted");
      const [ev] = await sql`select from_state, to_state from benchmarks.review_events re join benchmarks.claims c on c.id = re.subject_id where c.key = 'research:c_3' order by re.id desc limit 1`;
      assert.deepEqual([ev.from_state, ev.to_state], ["published", "retracted"]);
      const [old] = await sql`select old_row->>'task_count' as was from benchmarks.row_history where table_name = 'benchmark_versions' order by id desc limit 1`;
      assert.equal(old.was, "500");
      const [gap] = await sql`select old_row->>'key' as key from benchmarks.row_history where table_name = 'research_gaps' and op = 'DELETE'`;
      assert.equal(gap.key, "gap_1");
      assert.equal((await sql`select * from benchmarks.unsupported_facts`).length, 0);
    }));

  test("a slug can change without losing identity", noDb, () =>
    withDb(async (sql) => {
      const r = baseResearch();
      await importResearch(sql, await load(r));
      const [before] = await sql`select id from benchmarks.benchmark_families where research_id = 'example-bench'`;
      find(r, "benchmarks", "benchmark_id", "example-bench").slug = "example-bench-renamed";
      await importResearch(sql, await load(r));
      const [afterRename] = await sql`select id, slug from benchmarks.benchmark_families where research_id = 'example-bench'`;
      assert.deepEqual([afterRename.id, afterRename.slug], [before.id, "example-bench-renamed"]);
    }));

  test("a failed import rolls back and is recorded as failed", noDb, () =>
    withDb(async (sql) => {
      const r = baseResearch();
      r.runs["fixture"] = exampleRun();
      await importResearch(sql, await load(r), { allowFixtures: true });
      find(r, "benchmarks", "benchmark_id", "draft-bench").name = "Renamed";
      r.runs["fixture"] = exampleRun({ outcomes: [{ metric: "pass_rate", value: 99, unit: "percent" }] });
      await assert.rejects(importResearch(sql, await load(r), { allowFixtures: true }), /immutable/);
      const [f] = await sql`select name from benchmarks.benchmark_families where research_id = 'draft-bench'`;
      assert.equal(f.name, "DraftBench");
      const jobs = await sql`select status, error from benchmarks.ingestion_jobs order by id`;
      assert.equal(jobs.at(-1)!.status, "failed");
      assert.match(jobs.at(-1)!.error as string, /immutable/);
    }));
});

describe("database rules", () => {
  test("a published claim without supporting evidence cannot be committed", noDb, () =>
    withDb(async (sql) => {
      await importResearch(sql, await load(baseResearch()));
      await assert.rejects(
        sql.begin(async (tx) => {
          await tx`delete from benchmarks.claim_evidence where claim_id = (select id from benchmarks.claims where key = 'research:c_1')`;
        }),
        /no supporting evidence/,
      );
    }));

  test("the database rejects a duplicate citation of the same experiment", noDb, () =>
    withDb(async (sql) => {
      await importResearch(sql, await load(baseResearch()));
      await assert.rejects(
        sql.begin(async (tx) => {
          const [c] = await tx`select * from benchmarks.benchmark_citations limit 1`;
          const [claim] = await tx`insert into benchmarks.claims (key, subject_id, field, statement) values ('dup', ${c.family_id as string}, 'citation', 'dup') returning id`;
          await tx`
            insert into benchmarks.benchmark_citations (key, family_id, version_id, citing_org_id, model_id, kind, cited_on, cited_precision, claim_id)
            values ('dup', ${c.family_id as string}, ${c.version_id as string}, ${c.citing_org_id as string}, ${c.model_id as string}, ${c.kind as string}, ${c.cited_on as Date}, ${c.cited_precision as string}, ${claim.id as string})`;
        }),
        /duplicate key/,
      );
    }));

  test("a run's split must belong to the run's version", noDb, () =>
    withDb(async (sql) => {
      const r = baseResearch();
      r.runs["ok"] = exampleRun();
      await importResearch(sql, await load(r), { allowFixtures: true });
      const [other] = await sql`select id from benchmarks.benchmark_versions where research_id = 'draft-v0'`;
      await assert.rejects(sql`update benchmarks.evaluation_runs set version_id = ${other.id as string}`, /foreign key/);
    }));

  test("published values not backed by a matching claim show up in unsupported_facts", noDb, () =>
    withDb(async (sql) => {
      await importResearch(sql, await load(baseResearch()));
      await sql`update benchmarks.benchmark_versions set task_count = 501 where research_id = 'ex-v1'`;
      const rows = await sql`select label, field from benchmarks.unsupported_facts`;
      assert.deepEqual(rows.map((x) => [x.label, x.field]), [["example-bench@1.0", "task_count"]]);
    }));

  test("source snapshots are immutable; a new capture is a new snapshot", noDb, () =>
    withDb(async (sql) => {
      const r = baseResearch();
      await importResearch(sql, await load(r));
      await assert.rejects(sql`update benchmarks.source_snapshots set archive_url = 'https://x.org/'`, /immutable/);
      find(r, "sources", "source_id", "s_paper").content_hash = "b".repeat(64);
      await importResearch(sql, await load(r));
      const snaps = await sql`select content_hash from benchmarks.source_snapshots s join benchmarks.sources so on so.id = s.source_id where so.key = 's_paper' order by content_hash nulls first`;
      assert.deepEqual(snaps.map((s) => s.content_hash), [null, "b".repeat(64)]);
    }));
});

describe("frontier runs", () => {
  test("fixtures are refused unless explicitly allowed, and marked when they are", noDb, () =>
    withDb(async (sql) => {
      const r = baseResearch();
      r.runs["fixture"] = exampleRun();
      const bundle = await load(r);
      await assert.rejects(importResearch(sql, bundle), /fixture/);
      await importResearch(sql, bundle, { allowFixtures: true });
      const [run] = await sql`select is_fixture, origin, status from benchmarks.evaluation_runs`;
      assert.deepEqual([run.is_fixture, run.origin, run.status], [true, "frontier_run", "completed"]);
    }));

  test("runs import usage as measured, with missing values left NULL", noDb, () =>
    withDb(async (sql) => {
      const r = baseResearch();
      r.runs["fixture"] = exampleRun();
      await importResearch(sql, await load(r), { allowFixtures: true });
      const [u] = await sql`select attempts_planned, attempts_completed, tool_calls, api_cost_usd::float as cost, cost_coverage::float as cov from benchmarks.run_usage`;
      assert.deepEqual([u.attempts_planned, u.attempts_completed, u.tool_calls, u.cost, u.cov], [2000, 1990, null, 120.5, 0.98]);
      const tokens = await sql`select category, tokens::int as n from benchmarks.run_token_usage order by category`;
      assert.deepEqual(tokens.map((t) => [t.category, t.n]), [["input", 1000000], ["output", 50000]]);
    }));

  test("re-importing a run is a no-op; changing it is an error", noDb, () =>
    withDb(async (sql) => {
      const r = baseResearch();
      r.runs["fixture"] = exampleRun();
      await importResearch(sql, await load(r), { allowFixtures: true });
      const again = await importResearch(sql, await load(r), { allowFixtures: true });
      assert.equal(again.counts.evaluation_runs.unchanged, 1);
      r.runs["fixture"] = exampleRun({ outcomes: [{ metric: "pass_rate", value: 99, unit: "percent" }] });
      await assert.rejects(importResearch(sql, await load(r), { allowFixtures: true }), /immutable/);
    }));

  test("model configurations are immutable", noDb, () =>
    withDb(async (sql) => {
      const r = baseResearch();
      r.runs["fixture"] = exampleRun();
      await importResearch(sql, await load(r), { allowFixtures: true });
      await assert.rejects(sql`update benchmarks.model_configs set reasoning_effort = 'low'`, /immutable/);
    }));
});

describe("isolation from unrelated data in the same database", () => {
  test("the writer role imports, but cannot read other schemas", noDb, () =>
    withDb(async (sql, url) => {
      await addEmployeeTable(sql);
      await withLoginRole(sql, url, "benchmarks_writer", async (as) => {
        await assertIsolated(as);
        await importResearch(as, await load(baseResearch()));
        assert.equal(await count(as, "benchmark_families"), 3);
        await assert.rejects(as`select * from public.employees`, /permission denied/);
      });
    }));

  test("the isolation check refuses admin connections and over-granted roles", noDb, () =>
    withDb(async (sql, url) => {
      await addEmployeeTable(sql);
      await assert.rejects(assertIsolated(sql), /superuser/);
      await withLoginRole(sql, url, "benchmarks_writer", async (as) => {
        await sql.unsafe(`grant select on public.employees to ${(await as`select current_user as u`)[0].u}`);
        await assert.rejects(assertIsolated(as), /public\.employees/);
      });
    }));

  test("the reader role can read the registry but not change it", noDb, () =>
    withDb(async (sql, url) => {
      await addEmployeeTable(sql);
      await importResearch(sql, await load(baseResearch()));
      await withLoginRole(sql, url, "benchmarks_reader", async (as) => {
        assert.equal(await count(as, "benchmark_families"), 3);
        assert.equal(await count(as, "research_gaps"), 1);
        assert.equal((await as`select * from benchmarks.family_adoption`).length, 3);
        await assert.rejects(as`update benchmarks.benchmark_families set name = 'x'`, /permission denied/);
        await assert.rejects(as`select * from public.employees`, /permission denied/);
      });
    }));
});

describe("migration runner", () => {
  test("re-running is a no-op, and an edited migration is refused", noDb, () =>
    withDb(async (sql) => {
      const again = await migrate(sql);
      assert.equal(again.applied.length, 0);
      assert.ok(again.skipped.length >= 6);

      const dir = await mkdtemp(join(tmpdir(), "migrations-"));
      dirs.push(dir);
      await cp(MIGRATIONS_DIR, dir, { recursive: true });
      const first = join(dir, "0001_registry_core.sql");
      await writeFile(first, (await readFile(first, "utf8")) + "\n-- edited\n");
      await assert.rejects(migrate(sql, dir), /edited after it was applied/);
    }));

  test("migrations never write outside the benchmarks schema", noDb, () =>
    withDb(async (sql) => {
      const [{ exists }] = await sql`select to_regclass('supabase_migrations.schema_migrations') is not null as exists`;
      assert.equal(exists, false);
      const outside = await sql`
        select n.nspname, c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname not in ('benchmarks', 'pg_catalog', 'information_schema', 'pg_toast') and c.relkind in ('r', 'v')`;
      assert.equal(outside.length, 0, `created outside the schema: ${outside.map((r) => `${r.nspname}.${r.relname}`).join(", ")}`);
    }));
});
