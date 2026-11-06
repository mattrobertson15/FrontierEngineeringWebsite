/**
 * Registry tests: contract, loader, migrations and importer.
 *
 * Database tests need TEST_DATABASE_URL: a Postgres (15+) connection that may create and drop
 * databases. Each test gets a fresh database with all migrations applied.
 *
 *   TEST_DATABASE_URL=postgres://postgres@127.0.0.1:54322/postgres npm run test:registry
 *
 * Without it, only the pure (no-database) tests run.
 */
import assert from "node:assert/strict";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { after, describe, test } from "node:test";
import postgres from "postgres";
import { stringify } from "yaml";
import { canonicalJson, dbEnums, parsePartialDate, sha256Of } from "./contract.ts";
import { loadResearch, ValidationError, type Bundle } from "./load.ts";
import { assertIsolated } from "./access.ts";
import { migrate, MIGRATIONS_DIR } from "./migrate.ts";
import { importResearch } from "./write.ts";

const ADMIN_URL = process.env.TEST_DATABASE_URL;
const noDb = { skip: ADMIN_URL ? false : "TEST_DATABASE_URL not set" };

/* ---------------------------------------------------------------- fixtures */

const SNAP = "2026-11-01T12:00:00Z";
const ev = (locator: string) => [{ source: "example-paper", locator }];

function baseResearch() {
  return {
    "organizations.yaml": [
      { slug: "frontier-engineering", name: "Frontier Engineering", type: "company" },
      { slug: "example-org", name: "Example Org", type: "academic" },
      { slug: "example-lab", name: "Example Lab", type: "lab" },
    ],
    "capabilities.yaml": [
      { slug: "coding", axis: "capability", name: "Coding" },
      { slug: "repo-repair", axis: "capability", name: "Repo repair", parent: "coding" },
      { slug: "software-engineering", axis: "domain", name: "Software engineering" },
    ],
    "licenses.yaml": [{ slug: "mit", name: "MIT", spdx_id: "MIT", category: "permissive" }],
    "metrics.yaml": [
      { id: "pass_rate", scope: "evaluation", name: "Pass rate", unit: "percent", direction: "higher_is_better", denominator: "planned attempts" },
      { id: "github_stars", scope: "engagement", name: "GitHub stars", unit: "count", direction: "neutral" },
    ],
    "models.yaml": [{ slug: "model-x", name: "Model X", provider: "example-lab" }],
    "sources.yaml": [
      { key: "example-paper", url: "https://example.org/paper", title: "Example paper", kind: "paper", publisher: "example-org", published_on: "2025-03", snapshots: [{ retrieved_at: SNAP }] },
      { key: "model-x-card", url: "https://example.org/model-x", title: "Model X card", kind: "model_card", publisher: "example-lab", snapshots: [{ retrieved_at: SNAP }] },
    ],
    benchmarks: {
      "example-bench": {
        slug: "example-bench",
        name: "ExampleBench",
        kind: "benchmark",
        summary: "Tests fixing real bugs.",
        maintainer: { value: "example-org", status: "reported", evidence: ev("Author list") },
        status: "active",
        profile_depth: "detailed",
        review_state: "published",
        reviewed_on: "2026-11-02",
        last_verified_on: "2026-11-01",
        aliases: ["ExBench"],
        capabilities: ["repo-repair", "software-engineering"],
        relationships: [{ kind: "related_to", target: "draft-bench" }],
        resources: [{ kind: "repository", url: "https://example.org/repo", license: "mit" }],
        versions: [
          {
            label: "1.0",
            default: true,
            released_on: { value: "2025-03", status: "reported", evidence: ev("Abstract") },
            splits: [{ name: "test", visibility: "public", task_count: { value: 500, status: "reported", evidence: ev("Table 1") } }],
          },
        ],
        claims: [{ id: "human-baseline", field: "human_baseline", statement: "Experts solved 72%.", value: 72, unit: "percent", status: "reported", evidence: ev("Section 4") }],
        citations: [
          {
            id: "lab-model-x",
            org: "example-lab",
            kind: "score_report",
            model: "model-x",
            version: "1.0",
            cited_on: "2026-05",
            status: "reported",
            evidence: [{ source: "model-x-card", locator: "Table 3" }],
          },
        ],
        audits: [
          { id: "grading", title: "Lenient tests", issue: "Some tests accept wrong patches.", severity: "medium", version: "1.0", affected_tasks: 12, reported_on: "2026-01", status: "reported", evidence: ev("Errata") },
        ],
      },
      "draft-bench": {
        slug: "draft-bench",
        name: "DraftBench",
        kind: "unclassified",
        review_state: "draft",
        maintainer: null,
        versions: [{ label: "0.1", released_on: null, splits: [{ name: "dev", task_count: null }] }],
      },
    } as Record<string, Record<string, unknown>>,
    runs: {} as Record<string, unknown>,
  };
}
type Research = ReturnType<typeof baseResearch>;

function exampleRun(overrides: Record<string, unknown> = {}) {
  return {
    contract: "frontier-run/v1",
    experiment_id: "fixture-example-bench-model-x-001",
    fixture: true,
    benchmark: { family: "example-bench", version: "1.0", split: "test" },
    model: { slug: "model-x", config: { reasoning_effort: "high" } },
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

async function writeResearch(r: Research): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "research-"));
  dirs.push(dir);
  await mkdir(join(dir, "benchmarks"));
  await mkdir(join(dir, "runs"));
  for (const [name, data] of Object.entries(r)) {
    if (name.endsWith(".yaml")) await writeFile(join(dir, name), stringify(data));
  }
  for (const [slug, b] of Object.entries(r.benchmarks)) await writeFile(join(dir, "benchmarks", `${slug}.yaml`), stringify(b));
  for (const [id, run] of Object.entries(r.runs)) await writeFile(join(dir, "runs", `${id}.json`), JSON.stringify(run));
  return dir;
}

const load = async (r: Research): Promise<Bundle> => loadResearch(await writeResearch(r));

async function expectProblems(r: Research, ...fragments: string[]) {
  await assert.rejects(load(r), (e: unknown) => {
    assert.ok(e instanceof ValidationError, String(e));
    for (const f of fragments) {
      assert.ok(e.problems.some((p) => p.includes(f)), `expected a problem mentioning "${f}", got:\n${e.problems.join("\n")}`);
    }
    return true;
  });
}

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
});

describe("loader", () => {
  test("the fixture research is valid", async () => {
    const b = await load(baseResearch());
    assert.equal(b.benchmarks.length, 2);
  });

  test("the repository's research/ directory is valid", async () => {
    await loadResearch(resolve(import.meta.dirname, "../../research"));
  });

  test("a published fact without supporting evidence is rejected", async () => {
    const r = baseResearch();
    (r.benchmarks["example-bench"].versions as { splits: { task_count: { evidence: unknown[] } }[] }[])[0].splits[0].task_count.evidence = [];
    await expectProblems(r, "split 1.0/test task_count: published, so it needs at least one supporting evidence");
  });

  test("drafts may be incomplete, and unknown facts are null", async () => {
    const b = await load(baseResearch());
    const draft = b.benchmarks.find((x) => x.slug === "draft-bench")!;
    assert.equal(draft.maintainer, null);
    assert.equal(draft.versions[0].splits[0].task_count, null);
  });

  test("unquoted numeric version labels are rejected with a hint", async () => {
    const r = baseResearch();
    (r.benchmarks["draft-bench"].versions as { label: unknown }[])[0].label = 1.0;
    await expectProblems(r, "quoted string");
  });

  test("dangling references are reported with their file", async () => {
    const r = baseResearch();
    const b = r.benchmarks["example-bench"];
    b.capabilities = ["nope"];
    (b.citations as { org: string }[])[0].org = "ghost-lab";
    (b.claims as { evidence: { source: string; locator: string }[] }[])[0].evidence = [{ source: "missing-source", locator: "x" }];
    await expectProblems(r, 'unknown capability "nope"', 'unknown organization "ghost-lab"', 'unknown source "missing-source"');
  });

  test("duplicate citations of one experiment are caught before the database", async () => {
    const r = baseResearch();
    const cites = r.benchmarks["example-bench"].citations as Record<string, unknown>[];
    cites.push({ ...cites[0], id: "lab-model-x-blog" });
    await expectProblems(r, "duplicate citation (same org, model, version, kind and date)");
  });

  test("structured fields can't be smuggled in as free-form claims", async () => {
    const r = baseResearch();
    (r.benchmarks["example-bench"].claims as { field: string }[])[0].field = "task_count";
    await expectProblems(r, '"task_count" is a structured field');
  });

  test("runs must reference an existing version, split, model and evaluation metric", async () => {
    const r = baseResearch();
    r.runs["bad"] = exampleRun({ benchmark: { family: "example-bench", version: "1.0", split: "nope" }, outcomes: [{ metric: "github_stars", value: 1, unit: "count" }] });
    await expectProblems(r, 'has no split "nope"', 'metric "github_stars" is not an evaluation metric');
  });
});

/* ---------------------------------------------------------------- database tests */

describe("migrations", () => {
  test("every table has row level security enabled", noDb, () =>
    withDb(async (sql) => {
      const open = await sql`select tablename from pg_tables where schemaname = 'benchmarks' and not rowsecurity`;
      assert.deepEqual(open.map((r) => r.tablename), []);
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
      assert.ok(first.counts.benchmark_families.created === 2);
      assert.equal(await count(sql, "claims"), 6); // maintainer, released_on, task_count, human_baseline, citation, audit
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

  test("unknown values stay NULL in the database", noDb, () =>
    withDb(async (sql) => {
      await importResearch(sql, await load(baseResearch()));
      const [f] = await sql`select maintainer_id from benchmarks.benchmark_families where slug = 'draft-bench'`;
      const [v] = await sql`select released_on, released_precision from benchmarks.benchmark_versions where label = '0.1'`;
      const [s] = await sql`select task_count, visibility from benchmarks.benchmark_splits where name = 'dev'`;
      assert.equal(f.maintainer_id, null);
      assert.equal(v.released_on, null);
      assert.equal(v.released_precision, null);
      assert.equal(s.task_count, null);
      assert.equal(s.visibility, "unknown");
      const [{ n }] = await sql`select count(*)::int as n from benchmarks.claims c join benchmarks.benchmark_families f on f.id = c.subject_id where f.slug = 'draft-bench'`;
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

      const split = (r.benchmarks["example-bench"].versions as { splits: { task_count: { value: number } }[] }[])[0].splits[0];
      split.task_count.value = 499;
      r.benchmarks["example-bench"].claims = [];
      const report = await importResearch(sql, await load(r));

      assert.equal(report.counts.claims.retracted, 1);
      const [claim] = await sql`select review_state from benchmarks.claims where key = 'research:example-bench/human-baseline'`;
      assert.equal(claim.review_state, "retracted");
      const [ev] = await sql`select from_state, to_state from benchmarks.review_events re join benchmarks.claims c on c.id = re.subject_id where c.key = 'research:example-bench/human-baseline' order by re.id desc limit 1`;
      assert.deepEqual([ev.from_state, ev.to_state], ["published", "retracted"]);

      const [old] = await sql`select old_row->>'task_count' as was from benchmarks.row_history where table_name = 'benchmark_splits' order by id desc limit 1`;
      assert.equal(old.was, "500");
      const [now] = await sql`select task_count from benchmarks.benchmark_splits where name = 'test'`;
      assert.equal(now.task_count, 499);
      assert.equal((await sql`select * from benchmarks.unsupported_facts`).length, 0);
    }));

  test("a failed import rolls back and is recorded as failed", noDb, () =>
    withDb(async (sql) => {
      const r = baseResearch();
      await importResearch(sql, await load(r));
      // Rewriting a recorded snapshot is forbidden: snapshots are immutable.
      (r["sources.yaml"][0].snapshots[0] as Record<string, string>).content_hash = "b".repeat(64);
      (r.benchmarks["draft-bench"] as Record<string, string>).name = "Renamed";
      await assert.rejects(importResearch(sql, await load(r)), /immutable/);
      const [f] = await sql`select name from benchmarks.benchmark_families where slug = 'draft-bench'`;
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
          await tx`delete from benchmarks.claim_evidence where claim_id = (select id from benchmarks.claims where key = 'research:example-bench/maintainer')`;
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
        /benchmark_citations_family_id_version_id_citing_org_id_model_id_kind_cited_on_key|duplicate key/,
      );
    }));

  test("a run's split must belong to the run's version", noDb, () =>
    withDb(async (sql) => {
      const r = baseResearch();
      r.runs["ok"] = exampleRun();
      await importResearch(sql, await load(r), { allowFixtures: true });
      const [other] = await sql`select id from benchmarks.benchmark_versions where label = '0.1'`;
      await assert.rejects(sql`update benchmarks.evaluation_runs set version_id = ${other.id as string}`, /foreign key/);
    }));

  test("published values not backed by a matching claim show up in unsupported_facts", noDb, () =>
    withDb(async (sql) => {
      await importResearch(sql, await load(baseResearch()));
      await sql`update benchmarks.benchmark_splits set task_count = 501 where name = 'test'`;
      const rows = await sql`select label, field from benchmarks.unsupported_facts`;
      assert.deepEqual(rows.map((x) => [x.label, x.field]), [["example-bench@1.0/test", "task_count"]]);
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
        assert.equal(await count(as, "benchmark_families"), 2);
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
        assert.equal(await count(as, "benchmark_families"), 2);
        assert.equal((await as`select * from benchmarks.family_adoption`).length, 2);
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
      assert.ok(again.skipped.length >= 5);

      const dir = await mkdtemp(join(tmpdir(), "migrations-"));
      dirs.push(dir);
      await cp(MIGRATIONS_DIR, dir, { recursive: true });
      const first = join(dir, "0001_registry_core.sql");
      await writeFile(first, (await readFile(first, "utf8")) + "\n-- edited\n");
      await assert.rejects(migrate(sql, dir), /edited after it was applied/);
    }));

  test("migrations never write to Supabase's migration history", noDb, () =>
    withDb(async (sql) => {
      const [{ exists }] = await sql`select to_regclass('supabase_migrations.schema_migrations') is not null as exists`;
      assert.equal(exists, false);
      const outside = await sql`
        select n.nspname, c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname not in ('benchmarks', 'pg_catalog', 'information_schema', 'pg_toast') and c.relkind in ('r', 'v')`;
      assert.equal(outside.length, 0, `created outside the schema: ${outside.map((r) => `${r.nspname}.${r.relname}`).join(", ")}`);
    }));
});
