/**
 * Writes a validated research bundle into Postgres.
 *
 * Guarantees
 *   * One transaction, serialized by an advisory lock: an import lands completely or not at all.
 *   * Idempotent: rows are matched on natural keys and only updated when a value changed, so a
 *     second run of the same commit creates and updates nothing (and adds no history rows).
 *   * History is kept: changed rows are copied to row_history by triggers; editorial state
 *     changes become review_events; claims removed from the files are retracted, not deleted.
 *   * Frontier runs are immutable: a re-import must match the stored payload hash exactly.
 *   * Every import is recorded in ingestion_jobs, and a failed import is recorded as failed.
 */
import type postgres from "postgres";
import {
  parsePartialDate,
  sha256Of,
  type BenchmarkFile,
  type Evidence,
  type Precision,
  type RunImportV1,
} from "./contract.ts";
import type { Bundle } from "./load.ts";

export const ADAPTER = "research-import";
export const ADAPTER_VERSION = "1";
/** Every claim this importer owns has this key prefix; retraction is scoped to it. */
export const CLAIM_PREFIX = "research:";

type Tx = postgres.TransactionSql;
type Row = Record<string, unknown>;
type Action = "created" | "updated" | "unchanged";

export type ImportOptions = {
  gitCommit?: string | null;
  /** Roll everything back at the end; report what would have changed. */
  dryRun?: boolean;
  /** Allow runs marked `fixture: true`. Tests only. */
  allowFixtures?: boolean;
};

export type ImportReport = {
  jobId: number | null;
  dryRun: boolean;
  counts: Record<string, Record<Action | "retracted" | "removed", number>>;
  warnings: string[];
};

class DryRunRollback extends Error {}

/** postgres.js rejects `undefined`; the database's word for "unknown" is NULL. */
const nulls = (o: Row): Row => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === undefined ? null : v]));

export async function importResearch(sql: postgres.Sql, bundle: Bundle, opts: ImportOptions = {}): Promise<ImportReport> {
  const report: ImportReport = { jobId: null, dryRun: !!opts.dryRun, counts: {}, warnings: [] };
  const tally = (table: string, action: keyof ImportReport["counts"][string], n = 1) => {
    report.counts[table] ??= { created: 0, updated: 0, unchanged: 0, retracted: 0, removed: 0 };
    report.counts[table][action] += n;
  };

  const startJob = async (q: postgres.Sql | Tx) => {
    const [job] = await q`
      insert into benchmarks.ingestion_jobs (adapter, adapter_version, git_commit)
      values (${ADAPTER}, ${ADAPTER_VERSION}, ${opts.gitCommit ?? null}) returning id`;
    return Number(job.id);
  };

  // A real import records its job outside the transaction, so a failure is still on record.
  if (!opts.dryRun) report.jobId = await startJob(sql);

  try {
    await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(hashtext('benchmark-registry-import'))`;
      const jobId = report.jobId ?? (await startJob(tx));
      await writeBundle(tx, bundle, jobId, opts, tally, report.warnings);
      if (opts.dryRun) throw new DryRunRollback();
    });
  } catch (e) {
    if (e instanceof DryRunRollback) return report;
    if (report.jobId !== null) {
      await sql`
        update benchmarks.ingestion_jobs set status = 'failed', finished_at = now(), error = ${String((e as Error).message)}
        where id = ${report.jobId}`;
    }
    throw e;
  }

  await sql`
    update benchmarks.ingestion_jobs
    set status = 'succeeded', finished_at = now(), stats = ${sql.json({ counts: report.counts, warnings: report.warnings } as postgres.JSONValue)}
    where id = ${report.jobId}`;
  return report;
}

async function writeBundle(
  tx: Tx,
  bundle: Bundle,
  jobId: number,
  opts: ImportOptions,
  tally: (table: string, action: Action | "retracted" | "removed", n?: number) => void,
  warnings: string[],
) {
  /** Match on natural key; insert, or update only the columns whose values changed. */
  async function upsert(table: string, match: Row, values: Row, idColumn = "id"): Promise<{ id: string; action: Action }> {
    match = nulls(match);
    values = nulls(values);
    const where = tx`and`.join(
      Object.entries(match).map(([k, v]) => (v === null ? tx`${tx(k)} is null` : tx`${tx(k)} = ${v as string}`)),
    );
    const [found] = await tx`select ${tx(idColumn)} as id from ${tx("benchmarks." + table)} where ${where}`;
    if (!found) {
      const row = { ...match, ...values };
      const [ins] = await tx`insert into ${tx("benchmarks." + table)} ${tx(row, Object.keys(row))} returning ${tx(idColumn)} as id`;
      tally(table, "created");
      return { id: String(ins.id), action: "created" };
    }
    const cols = Object.keys(values);
    if (cols.length === 0) {
      tally(table, "unchanged");
      return { id: String(found.id), action: "unchanged" };
    }
    const changed = tx`or`.join(cols.map((c) => tx`${tx(c)} is distinct from ${values[c] as string}`));
    // Filter on the full natural key (not idColumn, which need not be unique on link tables).
    const res = await tx`
      update ${tx("benchmarks." + table)} set ${tx(values, cols)}
      where ${where} and (${changed})`;
    const action: Action = res.count ? "updated" : "unchanged";
    tally(table, action);
    return { id: String(found.id), action };
  }

  async function reviewEvent(subjectId: string, from: string | null, to: string, note?: string) {
    if (from === to) return;
    await tx`
      insert into benchmarks.review_events (subject_id, from_state, to_state, git_commit, actor, note, ingestion_job_id)
      values (${subjectId}, ${from}, ${to}, ${opts.gitCommit ?? null}, 'git-import', ${note ?? null}, ${jobId})`;
  }

  /* ---------- reference data ---------- */

  const orgId = new Map<string, string>();
  for (const o of bundle.organizations) {
    const { id } = await upsert("organizations", { slug: o.slug }, { name: o.name, type: o.type, website: o.website });
    orgId.set(o.slug, id);
  }

  // Parents before children.
  const pending = [...bundle.capabilities];
  const placed = new Set<string>();
  while (pending.length) {
    const i = pending.findIndex((c) => !c.parent || placed.has(c.parent));
    if (i < 0) throw new Error(`capability parents form a cycle: ${pending.map((c) => c.slug).join(", ")}`);
    const [c] = pending.splice(i, 1);
    await upsert("capabilities", { slug: c.slug }, { axis: c.axis, name: c.name, description: c.description, parent_slug: c.parent }, "slug");
    placed.add(c.slug);
  }

  for (const l of bundle.licenses) {
    await upsert("licenses", { slug: l.slug }, { name: l.name, spdx_id: l.spdx_id, category: l.category, url: l.url }, "slug");
  }

  for (const m of bundle.metrics) {
    await upsert(
      "metric_definitions",
      { id: m.id },
      { scope: m.scope, name: m.name, unit: m.unit, direction: m.direction, aggregation: m.aggregation, denominator: m.denominator, description: m.description },
    );
  }

  const modelId = new Map<string, string>();
  for (const m of bundle.models) {
    const { id } = await upsert("models", { slug: m.slug }, { name: m.name, provider_id: orgId.get(m.provider), open_weights: m.open_weights });
    modelId.set(m.slug, id);
  }

  /* ---------- sources & snapshots ---------- */

  // source key -> snapshots ordered newest first, each with its id
  const snapshots = new Map<string, { at: number; id: string }[]>();
  for (const s of bundle.sources) {
    const date = s.published_on ? parsePartialDate(s.published_on) : null;
    const { id: sourceId } = await upsert(
      "sources",
      { key: s.key },
      {
        canonical_url: s.url,
        title: s.title,
        kind: s.kind,
        publisher_id: s.publisher ? orgId.get(s.publisher) : null,
        published_on: date?.date,
        published_precision: date?.precision,
      },
    );
    const list: { at: number; id: string }[] = [];
    for (const snap of s.snapshots) {
      // Snapshots are immutable; changing a recorded hash or archive raises an error by design.
      const { id } = await upsert(
        "source_snapshots",
        { source_id: sourceId, retrieved_at: new Date(snap.retrieved_at).toISOString() },
        { content_hash: snap.content_hash, archive_url: snap.archive_url },
      );
      list.push({ at: Date.parse(snap.retrieved_at), id });
    }
    snapshots.set(s.key, list.sort((a, b) => b.at - a.at));
  }

  const snapshotFor = (e: Evidence) => {
    const list = snapshots.get(e.source)!;
    return e.retrieved_at ? list.find((s) => s.at === Date.parse(e.retrieved_at!))!.id : list[0].id;
  };

  /* ---------- claims ---------- */

  const seenClaims = new Set<string>();

  type ClaimInput = {
    key: string;
    subjectId: string;
    field: string;
    statement: string;
    value?: { text?: string | null; numeric?: number | null; date?: { date: string; precision: Precision } | null; unit?: string | null };
    status: string;
    evidence: Evidence[];
    family: BenchmarkFile;
  };

  async function writeClaim(c: ClaimInput): Promise<string> {
    const key = CLAIM_PREFIX + c.key;
    seenClaims.add(key);
    const [prev] = await tx`select review_state from benchmarks.claims where key = ${key}`;
    const state = c.family.review_state;
    const { id } = await upsert(
      "claims",
      { key },
      {
        subject_id: c.subjectId,
        field: c.field,
        statement: c.statement,
        value_text: c.value?.text,
        value_numeric: c.value?.numeric,
        value_date: c.value?.date?.date,
        value_date_precision: c.value?.date?.precision,
        unit: c.value?.unit,
        status: c.status,
        review_state: state,
        reviewed_at: c.family.reviewed_on,
      },
    );
    await reviewEvent(id, (prev?.review_state as string) ?? null, state);

    // Sync evidence: the file is the whole truth for this claim.
    const desired = c.evidence.map((e) => ({ snapshot_id: snapshotFor(e), locator: e.locator, role: e.role, excerpt: e.excerpt ?? null }));
    const existing = await tx`select id, snapshot_id, locator from benchmarks.claim_evidence where claim_id = ${id}`;
    const keep = new Set(desired.map((d) => `${d.snapshot_id}|${d.locator}`));
    for (const ex of existing) {
      if (!keep.has(`${ex.snapshot_id}|${ex.locator}`)) {
        await tx`delete from benchmarks.claim_evidence where id = ${ex.id as string}`;
        tally("claim_evidence", "removed");
      }
    }
    for (const d of desired) {
      await upsert("claim_evidence", { claim_id: id, snapshot_id: d.snapshot_id, locator: d.locator }, { role: d.role, excerpt: d.excerpt });
    }
    return id;
  }

  /* ---------- benchmark families ---------- */

  const familyId = new Map<string, string>();
  const versionIds = new Map<string, Map<string, string>>(); // family slug -> label -> id
  const splitIds = new Map<string, string>(); // "family@label/name" -> id

  for (const b of bundle.benchmarks) {
    const [prev] = await tx`select id, review_state from benchmarks.benchmark_families where slug = ${b.slug}`;
    const { id: fid } = await upsert(
      "benchmark_families",
      { slug: b.slug },
      {
        name: b.name,
        kind: b.kind,
        summary: b.summary,
        description: b.description,
        maintainer_id: b.maintainer ? orgId.get(b.maintainer.value) : null,
        status: b.status,
        profile_depth: b.profile_depth,
        research_priority: b.research_priority,
        review_state: b.review_state,
        reviewed_at: b.reviewed_on,
        last_verified_on: b.last_verified_on,
      },
    );
    familyId.set(b.slug, fid);
    await reviewEvent(fid, (prev?.review_state as string) ?? null, b.review_state);

    // Aliases: replace the set.
    const aliasRows = await tx`select id, alias from benchmarks.benchmark_aliases where family_id = ${fid}`;
    const wanted = new Set(b.aliases);
    for (const a of aliasRows) {
      if (!wanted.has(a.alias as string)) {
        await tx`delete from benchmarks.benchmark_aliases where id = ${a.id as string}`;
        tally("benchmark_aliases", "removed");
      }
    }
    for (const alias of b.aliases) await upsert("benchmark_aliases", { family_id: fid, alias }, {});

    // Capabilities: replace the set; the first listed is primary.
    const capRows = await tx`select capability_slug from benchmarks.benchmark_capabilities where family_id = ${fid}`;
    for (const r of capRows) {
      if (!b.capabilities.includes(r.capability_slug as string)) {
        await tx`delete from benchmarks.benchmark_capabilities where family_id = ${fid} and capability_slug = ${r.capability_slug as string}`;
        tally("benchmark_capabilities", "removed");
      }
    }
    // Clear primaries first so moving "primary" between capabilities never trips the unique index.
    await tx`update benchmarks.benchmark_capabilities set is_primary = false where family_id = ${fid} and is_primary and capability_slug <> ${b.capabilities[0] ?? ""}`;
    for (const [i, slug] of b.capabilities.entries()) {
      await upsert("benchmark_capabilities", { family_id: fid, capability_slug: slug }, { is_primary: i === 0 }, "capability_slug");
    }

    // Versions: non-defaults first, so the default flag can move between versions.
    const labels = new Map<string, string>();
    versionIds.set(b.slug, labels);
    const ordered = [...b.versions].sort((x, y) => Number(x.default) - Number(y.default));
    for (const v of ordered) {
      const rel = v.released_on ? parsePartialDate(v.released_on.value) : null;
      const { id: vid } = await upsert(
        "benchmark_versions",
        { family_id: fid, label: v.label },
        {
          released_on: rel?.date,
          released_precision: rel?.precision,
          is_default: v.default,
          dataset_hash: v.dataset_hash,
          harness_commit: v.harness_commit,
          notes: v.notes,
        },
      );
      labels.set(v.label, vid);
      if (v.released_on) {
        await writeClaim({
          key: `${b.slug}@${v.label}/released_on`,
          subjectId: vid,
          field: "released_on",
          statement: `${b.name} ${v.label} was released in ${v.released_on.value}.`,
          value: { date: rel },
          status: v.released_on.status,
          evidence: v.released_on.evidence,
          family: b,
        });
      }
      for (const s of v.splits) {
        const { id: sid } = await upsert(
          "benchmark_splits",
          { version_id: vid, name: s.name },
          { visibility: s.visibility, task_count: s.task_count?.value, notes: s.notes },
        );
        splitIds.set(`${b.slug}@${v.label}/${s.name}`, sid);
        if (s.task_count) {
          await writeClaim({
            key: `${b.slug}@${v.label}/${s.name}/task_count`,
            subjectId: sid,
            field: "task_count",
            statement: `The ${s.name} split of ${b.name} ${v.label} has ${s.task_count.value} tasks.`,
            value: { numeric: s.task_count.value, unit: "tasks" },
            status: s.task_count.status,
            evidence: s.task_count.evidence,
            family: b,
          });
        }
      }
      const staleSplits = await tx`
        select name from benchmarks.benchmark_splits
        where version_id = ${vid} and not (name = any(${v.splits.map((s) => s.name)}::text[]))`;
      for (const s of staleSplits) warnings.push(`${b.slug}@${v.label}: split "${s.name}" is in the database but not in the file (kept)`);
    }
    const staleVersions = await tx`
      select label from benchmarks.benchmark_versions
      where family_id = ${fid} and not (label = any(${b.versions.map((v) => v.label)}::text[]))`;
    for (const v of staleVersions) warnings.push(`${b.slug}: version "${v.label}" is in the database but not in the file (kept)`);

    if (b.maintainer) {
      await writeClaim({
        key: `${b.slug}/maintainer`,
        subjectId: fid,
        field: "maintainer",
        statement: `${b.name} is maintained by ${bundle.organizations.find((o) => o.slug === b.maintainer!.value)!.name}.`,
        value: { text: b.maintainer.value },
        status: b.maintainer.status,
        evidence: b.maintainer.evidence,
        family: b,
      });
    }

    for (const c of b.claims) {
      const subjectId = c.subject.startsWith("version:")
        ? labels.get(c.subject.slice(8))!
        : c.subject.startsWith("split:")
          ? splitIds.get(`${b.slug}@${c.subject.slice(6)}`)!
          : fid;
      await writeClaim({
        key: `${b.slug}/${c.id}`,
        subjectId,
        field: c.field,
        statement: c.statement,
        value: typeof c.value === "number" ? { numeric: c.value, unit: c.unit } : { text: c.value, unit: c.unit },
        status: c.status,
        evidence: c.evidence,
        family: b,
      });
    }

    // Resources: replace the set.
    const desired = b.resources.map((r) => ({ version_id: r.version ? labels.get(r.version)! : null, kind: r.kind, url: r.url, r }));
    const resRows = await tx`select id, version_id, kind, url from benchmarks.benchmark_resources where family_id = ${fid}`;
    const keepRes = new Set(desired.map((d) => `${d.version_id}|${d.kind}|${d.url}`));
    for (const r of resRows) {
      if (!keepRes.has(`${r.version_id}|${r.kind}|${r.url}`)) {
        await tx`delete from benchmarks.benchmark_resources where id = ${r.id as string}`;
        tally("benchmark_resources", "removed");
      }
    }
    for (const d of desired) {
      await upsert(
        "benchmark_resources",
        { family_id: fid, version_id: d.version_id, kind: d.kind, url: d.url },
        { license_slug: d.r.license, access_conditions: d.r.access },
      );
    }

    for (const c of b.citations) {
      const orgName = bundle.organizations.find((o) => o.slug === c.org)!.name;
      const modelName = c.model ? bundle.models.find((m) => m.slug === c.model)!.name : null;
      const claimId = await writeClaim({
        key: `${b.slug}/citation/${c.id}`,
        subjectId: fid,
        field: "citation",
        statement: `${orgName} ${citationVerb[c.kind]} ${b.name}${c.version ? ` ${c.version}` : ""}${modelName ? ` for ${modelName}` : ""} (${c.cited_on}).`,
        status: c.status,
        evidence: c.evidence,
        family: b,
      });
      const date = parsePartialDate(c.cited_on);
      await upsert(
        "benchmark_citations",
        { key: `${b.slug}/${c.id}` },
        {
          family_id: fid,
          version_id: c.version ? labels.get(c.version) : null,
          citing_org_id: orgId.get(c.org),
          model_id: c.model ? modelId.get(c.model) : null,
          kind: c.kind,
          cited_on: date.date,
          cited_precision: date.precision,
          claim_id: claimId,
        },
      );
    }

    for (const a of b.audits) {
      const claimId = await writeClaim({
        key: `${b.slug}/audit/${a.id}`,
        subjectId: a.version ? labels.get(a.version)! : fid,
        field: "audit_finding",
        statement: `${a.title}: ${a.issue}`,
        value: a.affected_tasks !== undefined ? { numeric: a.affected_tasks, unit: "tasks" } : undefined,
        status: a.status,
        evidence: a.evidence,
        family: b,
      });
      const date = parsePartialDate(a.reported_on);
      await upsert(
        "benchmark_audits",
        { key: `${b.slug}/${a.id}` },
        {
          family_id: fid,
          version_id: a.version ? labels.get(a.version) : null,
          title: a.title,
          issue: a.issue,
          severity: a.severity,
          affected_tasks: a.affected_tasks,
          resolution: a.resolution,
          reported_on: date.date,
          reported_precision: date.precision,
          claim_id: claimId,
        },
      );
    }
  }

  // Relationships need every family to exist first.
  for (const b of bundle.benchmarks) {
    const fid = familyId.get(b.slug)!;
    const rows = await tx`select kind, object_family_id from benchmarks.benchmark_relationships where subject_family_id = ${fid}`;
    const keepRel = new Set(b.relationships.map((r) => `${r.kind}|${familyId.get(r.target)}`));
    for (const r of rows) {
      if (!keepRel.has(`${r.kind}|${r.object_family_id}`)) {
        await tx`delete from benchmarks.benchmark_relationships where subject_family_id = ${fid} and kind = ${r.kind as string} and object_family_id = ${r.object_family_id as string}`;
        tally("benchmark_relationships", "removed");
      }
    }
    for (const r of b.relationships) {
      await upsert(
        "benchmark_relationships",
        { subject_family_id: fid, kind: r.kind, object_family_id: familyId.get(r.target) },
        { notes: r.notes },
        "subject_family_id",
      );
    }
  }

  /* ---------- retraction (never delete editorial history) ---------- */

  const retractedClaims = await tx`
    update benchmarks.claims c set review_state = 'retracted'
    from (
      select id, review_state as was from benchmarks.claims
      where key like ${CLAIM_PREFIX + "%"} and review_state <> 'retracted' and not (key = any(${[...seenClaims]}::text[]))
      for update
    ) p
    where c.id = p.id
    returning c.id, p.was`;
  for (const c of retractedClaims) {
    tally("claims", "retracted");
    await reviewEvent(c.id as string, c.was as string, "retracted", "removed from research files");
  }
  const retractedFamilies = await tx`
    update benchmarks.benchmark_families f set review_state = 'retracted'
    from (
      select id, review_state as was from benchmarks.benchmark_families
      where review_state <> 'retracted' and not (slug = any(${[...familyId.keys()]}::text[]))
      for update
    ) p
    where f.id = p.id
    returning f.id, p.was`;
  for (const f of retractedFamilies) {
    tally("benchmark_families", "retracted");
    await reviewEvent(f.id as string, f.was as string, "retracted", "benchmark file removed");
  }

  /* ---------- Frontier runs ---------- */

  for (const run of bundle.runs) await writeRun(tx, run, { jobId, opts, orgId, modelId, versionIds, splitIds, tally });
}

const citationVerb: Record<string, string> = {
  mention: "mentioned",
  explicit_adoption: "adopted",
  score_report: "reported a score on",
  reproduction: "reproduced results on",
  audit: "audited",
  frontier_run: "ran",
};

async function writeRun(
  tx: Tx,
  run: RunImportV1,
  ctx: {
    jobId: number;
    opts: ImportOptions;
    orgId: Map<string, string>;
    modelId: Map<string, string>;
    versionIds: Map<string, Map<string, string>>;
    splitIds: Map<string, string>;
    tally: (table: string, action: Action, n?: number) => void;
  },
) {
  if (run.fixture && !ctx.opts.allowFixtures) {
    throw new Error(`run ${run.experiment_id} is a fixture; fixtures are never imported as real evaluations`);
  }
  const importHash = sha256Of(run);
  const [existing] = await tx`select import_hash from benchmarks.evaluation_runs where key = ${run.experiment_id}`;
  if (existing) {
    if (existing.import_hash !== importHash) {
      throw new Error(`run ${run.experiment_id} was already imported with different content; runs are immutable — use a new experiment_id`);
    }
    ctx.tally("evaluation_runs", "unchanged");
    return;
  }

  const insertOnce = async (table: string, hashCol: string, row: Row): Promise<string> => {
    const r = nulls(row);
    await tx`insert into ${tx("benchmarks." + table)} ${tx(r, Object.keys(r))} on conflict (${tx(hashCol)}) do nothing`;
    const [found] = await tx`select id from ${tx("benchmarks." + table)} where ${tx(hashCol)} = ${r[hashCol] as string}`;
    return String(found.id);
  };

  const mc = run.model.config;
  const modelConfigId = await insertOnce("model_configs", "config_hash", {
    model_id: ctx.modelId.get(run.model.slug),
    config_hash: sha256Of({ model: run.model.slug, ...mc }),
    reasoning_effort: mc.reasoning_effort,
    temperature: mc.temperature,
    max_context_tokens: mc.max_context_tokens,
    tool_mode: mc.tool_mode,
    extra: tx.json(mc.extra as postgres.JSONValue),
  });
  const agentId = run.agent
    ? await insertOnce("agent_configs", "config_hash", {
        config_hash: sha256Of(run.agent),
        name: run.agent.name,
        version: run.agent.version,
        harness_commit: run.agent.harness_commit,
        prompt_hash: run.agent.prompt_hash,
        tools: run.agent.tools,
        extra: tx.json(run.agent.extra as postgres.JSONValue),
      })
    : null;
  const envId = run.environment
    ? await insertOnce("environment_specs", "spec_hash", {
        spec_hash: sha256Of(run.environment),
        image: run.environment.image,
        image_digest: run.environment.image_digest,
        description: run.environment.description,
        extra: tx.json(run.environment.extra as postgres.JSONValue),
      })
    : null;

  const versionId = ctx.versionIds.get(run.benchmark.family)!.get(run.benchmark.version)!;
  const splitId = run.benchmark.split ? ctx.splitIds.get(`${run.benchmark.family}@${run.benchmark.version}/${run.benchmark.split}`)! : null;

  const runRow = nulls({
    key: run.experiment_id,
    version_id: versionId,
    split_id: splitId,
    model_config_id: modelConfigId,
    agent_config_id: agentId,
    environment_id: envId,
    evaluator_id: ctx.orgId.get(run.evaluator),
    origin: "frontier_run",
    status: run.status,
    repetitions: run.protocol.repetitions,
    grader: run.protocol.grader,
    protocol_hash: run.protocol.protocol_hash,
    started_at: run.timestamps.started_at,
    completed_at: run.timestamps.completed_at,
    import_hash: importHash,
    is_fixture: run.fixture,
    ingestion_job_id: ctx.jobId,
    notes: run.protocol.notes,
  });
  const [{ id: runId }] = await tx`insert into benchmarks.evaluation_runs ${tx(runRow, Object.keys(runRow))} returning id`;
  ctx.tally("evaluation_runs", "created");

  for (const o of run.outcomes) {
    const r = nulls({
      run_id: runId,
      metric_id: o.metric,
      original_value: o.value,
      original_unit: o.unit,
      normalized_value: o.normalized,
      sample_size: o.sample_size,
      ci_low: o.ci?.low,
      ci_high: o.ci?.high,
      ci_level: o.ci?.level,
      ci_method: o.ci?.method,
    });
    await tx`insert into benchmarks.evaluation_results ${tx(r, Object.keys(r))}`;
    ctx.tally("evaluation_results", "created");
  }

  const { tokens, ...usage } = run.usage;
  if (Object.keys(usage).length) {
    const u = nulls({ run_id: runId, ...usage });
    await tx`insert into benchmarks.run_usage ${tx(u, Object.keys(u))}`;
    ctx.tally("run_usage", "created");
  }
  for (const [category, count] of Object.entries(tokens)) {
    await tx`insert into benchmarks.run_token_usage (run_id, category, tokens) values (${runId as string}, ${category}, ${count})`;
    ctx.tally("run_token_usage", "created");
  }
  for (const a of run.artifacts) {
    const r = nulls({ run_id: runId, kind: a.kind, url: a.url, sha256: a.sha256, bytes: a.bytes });
    await tx`insert into benchmarks.run_artifacts ${tx(r, Object.keys(r))}`;
    ctx.tally("run_artifacts", "created");
  }
}
