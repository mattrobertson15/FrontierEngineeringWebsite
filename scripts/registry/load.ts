/**
 * Reads the research package (research/*.csv, research/runs/*.json, research/manifest.json),
 * validates every cell against the contract, then checks keys, references and the import rules
 * from the package README plus our publication rules. Every problem is reported at once with
 * its file and line, so one `registry:validate` run shows the whole picture.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  buildManifest,
  canonicalJson,
  convertCell,
  parseCsv,
  RunImportV1,
  tableNames,
  tables,
  type Column,
  type Row,
  type TableName,
} from "./contract.ts";

export type Bundle = {
  rows: Record<TableName, Row[]>;
  runs: RunImportV1[];
  manifestMeta: { schema_version: string; research_date: string; package_status: string };
};

export class ValidationError extends Error {
  problems: string[];
  constructor(problems: string[]) {
    super(`${problems.length} problem(s) in research files:\n${problems.map((p) => `  • ${p}`).join("\n")}`);
    this.problems = problems;
  }
}

const DEFAULT_META = { schema_version: "0.2.0", research_date: "", package_status: "research_staging" };

/** Reads and type-checks every table. Throws ValidationError with all problems found. */
export async function loadResearch(root: string, opts: { checkManifest?: boolean } = {}): Promise<Bundle> {
  const problems: string[] = [];
  const rows = {} as Record<TableName, Row[]>;
  const lineOf = new Map<Row, number>();

  for (const name of tableNames) {
    const spec = tables[name];
    const where = `research/${spec.file}`;
    rows[name] = [];
    let text: string;
    try {
      text = await readFile(join(root, spec.file), "utf8");
    } catch (e) {
      problems.push(`${where}: file is missing${(e as NodeJS.ErrnoException).code === "ENOENT" ? " (create it with just the header row)" : ""}`);
      continue;
    }
    let grid: string[][];
    try {
      grid = parseCsv(text);
    } catch (e) {
      problems.push(`${where}: could not parse CSV — ${(e as Error).message}`);
      continue;
    }
    const expected = (spec.columns as Column[]).map((c) => c.name);
    const header = grid[0] ?? [];
    if (header.join(",") !== expected.join(",")) {
      problems.push(`${where}: header must be exactly\n      ${expected.join(",")}\n    found\n      ${header.join(",")}`);
      continue;
    }
    grid.slice(1).forEach((cells, i) => {
      const line = i + 2;
      if (cells.length !== expected.length) {
        problems.push(`${where}:${line}: has ${cells.length} cells, expected ${expected.length}`);
        return;
      }
      const row: Row = {};
      (spec.columns as Column[]).forEach((col, j) => {
        const [value, problem] = convertCell(col, cells[j]);
        if (problem) problems.push(`${where}:${line}: ${col.name} ${problem}`);
        row[col.name] = value;
      });
      rows[name].push(row);
      lineOf.set(row, line);
    });
  }

  const at = (table: TableName, row: Row) => `research/${tables[table].file}:${lineOf.get(row) ?? "?"}`;
  const s = (row: Row, col: string) => row[col] as string | null;

  /* ---------- keys and references ---------- */

  const index = {} as Record<TableName, Map<string, Row>>;
  for (const name of tableNames) {
    index[name] = new Map();
    for (const row of rows[name]) {
      const key = tables[name].key.map((k) => String(row[k])).join("|");
      if (index[name].has(key)) problems.push(`${at(name, row)}: duplicate key ${tables[name].key.join("+")} = ${key}`);
      index[name].set(key, row);
    }
  }
  for (const name of tableNames) {
    for (const [col, toTable, toCol] of tables[name].refs) {
      const target = toTable as TableName;
      const lookup = tables[target].key.length === 1 && tables[target].key[0] === toCol ? index[target] : null;
      for (const row of rows[name]) {
        const v = s(row, col);
        if (v === null) continue;
        const found = lookup ? lookup.has(v) : rows[target].some((r) => r[toCol] === v);
        if (!found) problems.push(`${at(name, row)}: ${col} "${v}" has no row in ${tables[target].file}`);
      }
    }
  }

  const benchmarks = index.benchmarks;
  const versions = index.versions;
  const claims = index.claims;

  /* ---------- the package's import rules ---------- */

  // A version must belong to the same benchmark as the row that names it.
  for (const name of ["claims", "audits", "result_observations", "citations"] as const) {
    for (const row of rows[name]) {
      const v = s(row, "version_id");
      const version = v ? versions.get(v) : undefined;
      if (version && version.benchmark_id !== row.benchmark_id) {
        problems.push(`${at(name, row)}: version ${v} belongs to ${version.benchmark_id}, not ${row.benchmark_id}`);
      }
    }
  }

  // Claim values must parse as their declared type.
  for (const c of rows.claims) {
    const v = s(c, "value")!;
    if (c.value_type === "number" && !/^-?\d+(\.\d+)?$/.test(v)) problems.push(`${at("claims", c)}: value "${v}" is not a number`);
    if (c.value_type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(v)) problems.push(`${at("claims", c)}: value "${v}" is not an ISO date`);
  }

  // Every claim needs at least one supporting evidence row.
  const supported = new Set(rows.claim_evidence.filter((e) => e.evidence_role === "supports").map((e) => e.claim_id));
  for (const c of rows.claims) {
    if (!supported.has(c.claim_id)) problems.push(`${at("claims", c)}: claim ${c.claim_id} has no supporting evidence in claim_evidence.csv`);
  }
  for (const e of rows.claim_evidence) {
    if (e.capture_kind === "quotation" && !e.excerpt) problems.push(`${at("claim_evidence", e)}: a quotation needs its excerpt`);
  }

  // Structured version/split facts need a source, and must agree with any explicit claim.
  const explicit = (benchmarkId: unknown, versionId: unknown, predicate: string) =>
    rows.claims.filter((c) => c.benchmark_id === benchmarkId && c.version_id === versionId && c.predicate === predicate);
  for (const v of rows.versions) {
    if ((v.release_date !== null || v.task_count !== null) && !v.source_id) {
      problems.push(`${at("versions", v)}: release_date/task_count need a source_id as evidence`);
    }
    if (v.task_count !== null) {
      for (const c of explicit(v.benchmark_id, v.version_id, "task_count")) {
        if (Number(c.value) !== v.task_count) {
          problems.push(`${at("versions", v)}: task_count ${v.task_count} disagrees with claim ${c.claim_id} (${c.value})`);
        }
      }
    }
  }
  for (const sp of rows.splits) {
    if (sp.task_count !== null && !sp.source_id) problems.push(`${at("splits", sp)}: task_count needs a source_id as evidence`);
  }

  // Relationships: never self-referential.
  for (const r of rows.relationships) {
    if (r.from_benchmark_id === r.to_benchmark_id) problems.push(`${at("relationships", r)}: an entry cannot relate to itself`);
  }

  // Audits and citations are carried by a claim about the same benchmark and version.
  for (const name of ["audits", "citations"] as const) {
    for (const row of rows[name]) {
      const c = claims.get(s(row, "claim_id") ?? "");
      if (!c) continue;
      if (c.benchmark_id !== row.benchmark_id || (c.version_id ?? null) !== (row.version_id ?? null)) {
        problems.push(`${at(name, row)}: claim ${c.claim_id} is about ${c.benchmark_id}${c.version_id ? `@${c.version_id}` : ""}, not this ${name.slice(0, -1)}'s subject`);
      }
    }
  }
  for (const a of rows.audits) {
    const c = claims.get(s(a, "claim_id") ?? "");
    if (c?.predicate === "audit_verdict" && c.value !== a.verdict) {
      problems.push(`${at("audits", a)}: verdict "${a.verdict}" differs from claim ${c.claim_id} ("${c.value}")`);
    }
  }

  // Result observations are staging data: a "ready" row must have nothing missing.
  for (const o of rows.result_observations) {
    if (o.score_percent !== null && ((o.score_percent as number) < 0 || (o.score_percent as number) > 100)) {
      problems.push(`${at("result_observations", o)}: score_percent must be 0–100 (never a 0–1 fraction)`);
    }
    if (o.comparison_status === "ready" && o.missing_context) {
      problems.push(`${at("result_observations", o)}: comparison_status "ready" with missing_context still listed`);
    }
  }

  // Names and aliases resolve to exactly one entry.
  const names = new Map<string, string>();
  const claimName = (label: string, owner: string, where: string) => {
    const k = label.toLowerCase();
    const prior = names.get(k);
    if (prior && prior !== owner) problems.push(`${where}: "${label}" already names ${prior}`);
    names.set(k, owner);
  };
  for (const b of rows.benchmarks) claimName(s(b, "name")!, s(b, "benchmark_id")!, at("benchmarks", b));
  for (const a of rows.benchmark_aliases) claimName(s(a, "alias")!, s(a, "benchmark_id")!, at("benchmark_aliases", a));

  const slugs = new Map<string, Row>();
  for (const b of rows.benchmarks) {
    const prior = slugs.get(s(b, "slug")!);
    if (prior) problems.push(`${at("benchmarks", b)}: slug "${b.slug}" is also used by ${prior.benchmark_id}`);
    slugs.set(s(b, "slug")!, b);
  }

  const primaries = new Map<string, number>();
  for (const bc of rows.benchmark_capabilities) {
    if (bc.is_primary) primaries.set(s(bc, "benchmark_id")!, (primaries.get(s(bc, "benchmark_id")!) ?? 0) + 1);
  }
  for (const [b, n] of primaries) if (n > 1) problems.push(`research/benchmark_capabilities.csv: ${b} has ${n} primary capabilities (max 1)`);

  /* ---------- publication rules ---------- */

  const openP0 = new Set(rows.research_gaps.filter((g) => g.priority === "P0" && g.status === "open").map((g) => g.benchmark_id));
  for (const b of rows.benchmarks) {
    const where = at("benchmarks", b);
    if (b.identity_status === "primary_source_located" && !b.primary_source_id) {
      problems.push(`${where}: identity_status primary_source_located needs primary_source_id`);
    }
    if (b.maintenance_status !== null) {
      const backed = rows.claims.some((c) => c.benchmark_id === b.benchmark_id && (c.predicate === "maintenance_notice" || c.predicate === "maintenance_status"));
      if (!backed) problems.push(`${where}: maintenance_status "${b.maintenance_status}" needs a maintenance_notice or maintenance_status claim`);
    }
    if (b.review_state === "published") {
      if (b.entity_kind === "unclassified") problems.push(`${where}: published entries need an entity_kind other than unclassified`);
      if (!b.summary) problems.push(`${where}: published entries need a summary`);
      if (!b.reviewed_on) problems.push(`${where}: published entries need reviewed_on`);
      if (!b.checked_on) problems.push(`${where}: published entries need checked_on`);
      if (b.identity_status !== "primary_source_located") problems.push(`${where}: published entries need identity_status primary_source_located`);
      if (openP0.has(b.benchmark_id)) problems.push(`${where}: published entries cannot have open P0 research gaps`);
    }
  }

  /* ---------- Frontier runs (JSON) ---------- */

  const runs: RunImportV1[] = [];
  const runsDir = join(root, "runs");
  let runFiles: string[] = [];
  try {
    runFiles = (await readdir(runsDir)).filter((f) => f.endsWith(".json")).sort();
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  const seenRuns = new Set<string>();
  for (const f of runFiles) {
    const where = `research/runs/${f}`;
    let raw: unknown;
    try {
      raw = JSON.parse(await readFile(join(runsDir, f), "utf8"));
    } catch (e) {
      problems.push(`${where}: could not parse — ${(e as Error).message}`);
      continue;
    }
    const parsed = RunImportV1.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) problems.push(`${where}: ${issue.path.join(".") || "(root)"} — ${issue.message}`);
      continue;
    }
    const r = parsed.data;
    if (seenRuns.has(r.experiment_id)) problems.push(`${where}: duplicate experiment_id ${r.experiment_id}`);
    seenRuns.add(r.experiment_id);
    const version = versions.get(r.benchmark.version_id);
    if (!benchmarks.has(r.benchmark.benchmark_id)) problems.push(`${where}: unknown benchmark_id "${r.benchmark.benchmark_id}"`);
    if (!version) problems.push(`${where}: unknown version_id "${r.benchmark.version_id}"`);
    else if (version.benchmark_id !== r.benchmark.benchmark_id) problems.push(`${where}: version ${r.benchmark.version_id} belongs to ${version.benchmark_id}`);
    if (r.benchmark.split_id !== null) {
      const split = index.splits.get(r.benchmark.split_id);
      if (!split) problems.push(`${where}: unknown split_id "${r.benchmark.split_id}"`);
      else if (split.version_id !== r.benchmark.version_id) problems.push(`${where}: split ${r.benchmark.split_id} belongs to version ${split.version_id}`);
    }
    if (!index.models.has(r.model.model_id)) problems.push(`${where}: unknown model_id "${r.model.model_id}" (add it to models.csv)`);
    if (!index.organizations.has(r.evaluator)) problems.push(`${where}: unknown evaluator "${r.evaluator}"`);
    for (const o of r.outcomes) {
      const m = index.metric_definitions.get(o.metric);
      if (!m) problems.push(`${where}: unknown metric "${o.metric}"`);
      else if (m.scope !== "evaluation") problems.push(`${where}: metric "${o.metric}" is not an evaluation metric`);
    }
    if (new Set(r.outcomes.map((o) => o.metric)).size !== r.outcomes.length) problems.push(`${where}: duplicate outcome metric`);
    if (r.outcomes.length && r.status !== "completed" && r.status !== "incomplete") {
      problems.push(`${where}: only completed or incomplete runs can carry outcomes`);
    }
    runs.push(r);
  }

  /* ---------- manifest ---------- */

  let manifestMeta = DEFAULT_META;
  if (opts.checkManifest !== false) {
    try {
      const current = JSON.parse(await readFile(join(root, "manifest.json"), "utf8"));
      manifestMeta = { schema_version: current.schema_version, research_date: current.research_date, package_status: current.package_status };
      if (!problems.length && canonicalJson(current) !== canonicalJson(buildManifest(rows, manifestMeta))) {
        problems.push("research/manifest.json is out of date — run `npm run registry:manifest`");
      }
    } catch (e) {
      problems.push(`research/manifest.json: ${(e as NodeJS.ErrnoException).code === "ENOENT" ? "missing — run `npm run registry:manifest`" : (e as Error).message}`);
    }
  }

  if (problems.length) throw new ValidationError(problems);
  return { rows, runs, manifestMeta };
}
