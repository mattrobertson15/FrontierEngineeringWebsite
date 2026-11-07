/**
 * Writes a validated research package into Postgres.
 *
 * Guarantees
 *   * One transaction, serialized by an advisory lock: an import lands completely or not at all.
 *   * Idempotent: rows are matched on their stable research ids and only updated when a value
 *     changed, so re-importing the same commit creates and updates nothing (and adds no history).
 *   * History is kept: changed and deleted rows are copied to row_history by triggers; editorial
 *     state changes become review_events; claims removed from the files are retracted, not deleted.
 *   * Structured facts (version release date / task count, split task count, relationships) are
 *     written as claims backed by the row's source, so every published value has evidence.
 *   * Frontier runs are immutable: a re-import must match the stored payload hash exactly.
 *   * Every import is recorded in ingestion_jobs, and a failed import is recorded as failed.
 */
import type postgres from "postgres";
import { sha256Of, type Row, type RunImportV1 } from "./contract.ts";
import type { Bundle } from "./load.ts";

export const ADAPTER = "research-import";
export const ADAPTER_VERSION = "2";
/** Every claim this importer owns has this key prefix; retraction is scoped to it. */
export const CLAIM_PREFIX = "research:";

type Tx = postgres.TransactionSql;
type Values = Record<string, unknown>;
type Action = "created" | "updated" | "unchanged";
type Count = Action | "retracted" | "removed";

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
  counts: Record<string, Record<Count, number>>;
  warnings: string[];
};

class DryRunRollback extends Error {}

/** postgres.js rejects `undefined`; the database's word for "unknown" is NULL. */
const nulls = (o: Values): Values => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === undefined ? null : v]));
const str = (r: Row, c: string) => r[c] as string | null;

export async function importResearch(sql: postgres.Sql, bundle: Bundle, opts: ImportOptions = {}): Promise<ImportReport> {
  const report: ImportReport = { jobId: null, dryRun: !!opts.dryRun, counts: {}, warnings: [] };
  const tally = (table: string, action: Count, n = 1) => {
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
      await new Writer(tx, bundle, jobId, opts, tally, report.warnings).run();
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

type EvidenceInput = { researchId: string | null; snapshotId: string; locator: string; role: string; captureKind: string; excerpt: string | null };

class Writer {
  private orgId = new Map<string, string>();
  private orgByName = new Map<string, string>();
  private sourceId = new Map<string, string>();
  private snapshotId = new Map<string, string>();
  private familyId = new Map<string, string>();
  private versionId = new Map<string, string>();
  private splitId = new Map<string, string>();
  private claimId = new Map<string, string>();
  private modelId = new Map<string, string>();
  private familyRow = new Map<string, Row>();
  private seenClaims = new Set<string>();
  private rows: Bundle["rows"];
  private tx: Tx;
  private bundle: Bundle;
  private jobId: number;
  private opts: ImportOptions;
  private tally: (table: string, action: Count, n?: number) => void;
  private warnings: string[];

  constructor(
    tx: Tx,
    bundle: Bundle,
    jobId: number,
    opts: ImportOptions,
    tally: (table: string, action: Count, n?: number) => void,
    warnings: string[],
  ) {
    this.tx = tx;
    this.bundle = bundle;
    this.jobId = jobId;
    this.opts = opts;
    this.tally = tally;
    this.warnings = warnings;
    this.rows = bundle.rows;
  }

  /** Match on natural key; insert, or update only the columns whose values changed. */
  private async upsert(table: string, match: Values, values: Values, idColumn = "id"): Promise<{ id: string; action: Action }> {
    const tx = this.tx;
    match = nulls(match);
    values = nulls(values);
    const where = tx`and`.join(
      Object.entries(match).map(([k, v]) => (v === null ? tx`${tx(k)} is null` : tx`${tx(k)} = ${v as string}`)),
    );
    const [found] = await tx`select ${tx(idColumn)} as id from ${tx("benchmarks." + table)} where ${where}`;
    if (!found) {
      const row = { ...match, ...values };
      const [ins] = await tx`insert into ${tx("benchmarks." + table)} ${tx(row, Object.keys(row))} returning ${tx(idColumn)} as id`;
      this.tally(table, "created");
      return { id: String(ins.id), action: "created" };
    }
    const cols = Object.keys(values);
    if (cols.length === 0) {
      this.tally(table, "unchanged");
      return { id: String(found.id), action: "unchanged" };
    }
    const changed = tx`or`.join(cols.map((c) => tx`${tx(c)} is distinct from ${values[c] as string}`));
    // Filter on the full natural key (not idColumn, which need not be unique on link tables).
    const res = await tx`update ${tx("benchmarks." + table)} set ${tx(values, cols)} where ${where} and (${changed})`;
    const action: Action = res.count ? "updated" : "unchanged";
    this.tally(table, action);
    return { id: String(found.id), action };
  }

  /** Delete rows of `table` (scoped by `scope`) whose `keyCol` is not in `keep`. History keeps them. */
  private async prune(table: string, keyCol: string, keep: string[], scope = this.tx`true`) {
    const tx = this.tx;
    const gone = await tx`
      delete from ${tx("benchmarks." + table)}
      where ${scope} and ${tx(keyCol)} is not null and not (${tx(keyCol)}::text = any(${keep}::text[]))
      returning 1`;
    if (gone.length) this.tally(table, "removed", gone.length);
  }

  private async reviewEvent(subjectId: string, from: string | null, to: string, note?: string) {
    if (from === to) return;
    await this.tx`
      insert into benchmarks.review_events (subject_id, from_state, to_state, git_commit, actor, note, ingestion_job_id)
      values (${subjectId}, ${from}, ${to}, ${this.opts.gitCommit ?? null}, 'git-import', ${note ?? null}, ${this.jobId})`;
  }

  private snapshotOf(sourceResearchId: string) {
    return this.snapshotId.get(sourceResearchId)!;
  }

  /** The source's own locator, as default evidence locator for facts carried on a row. */
  private sourceLocator(sourceResearchId: string) {
    return str(this.rows.sources.find((s) => s.source_id === sourceResearchId)!, "locator") ?? "source record";
  }

  private async writeClaim(c: {
    key: string;
    benchmarkId: string;
    subjectId: string;
    field: string;
    statement: string;
    valueText?: string | null;
    valueNumeric?: number | null;
    valueDate?: string | null;
    unit?: string | null;
    status: string;
    checkedOn?: string | null;
    notes?: string | null;
    evidence: EvidenceInput[];
  }): Promise<string> {
    const tx = this.tx;
    const key = CLAIM_PREFIX + c.key;
    this.seenClaims.add(key);
    const family = this.familyRow.get(c.benchmarkId)!;
    const state = str(family, "review_state")!;
    const [prev] = await tx`select review_state from benchmarks.claims where key = ${key}`;
    const { id } = await this.upsert(
      "claims",
      { key },
      {
        subject_id: c.subjectId,
        field: c.field,
        statement: c.statement,
        value_text: c.valueText,
        value_numeric: c.valueNumeric,
        value_date: c.valueDate,
        value_date_precision: c.valueDate ? "day" : null,
        unit: c.unit,
        status: c.status,
        review_state: state,
        reviewed_at: str(family, "reviewed_on"),
        checked_on: c.checkedOn,
        notes: c.notes,
      },
    );
    await this.reviewEvent(id, (prev?.review_state as string) ?? null, state);

    // The files are the whole truth for this claim's evidence.
    const existing = await tx`select id, snapshot_id, locator from benchmarks.claim_evidence where claim_id = ${id}`;
    const keep = new Set(c.evidence.map((e) => `${e.snapshotId}|${e.locator}`));
    for (const ex of existing) {
      if (!keep.has(`${ex.snapshot_id}|${ex.locator}`)) {
        await tx`delete from benchmarks.claim_evidence where id = ${ex.id as string}`;
        this.tally("claim_evidence", "removed");
      }
    }
    for (const e of c.evidence) {
      await this.upsert(
        "claim_evidence",
        { claim_id: id, snapshot_id: e.snapshotId, locator: e.locator },
        { research_id: e.researchId, role: e.role, capture_kind: e.captureKind, excerpt: e.excerpt },
      );
    }
    return id;
  }

  /** Evidence for a fact carried on a row (version, split, relationship): the row's source. */
  private rowEvidence(sourceResearchId: string): EvidenceInput[] {
    return [
      {
        researchId: null,
        snapshotId: this.snapshotOf(sourceResearchId),
        locator: this.sourceLocator(sourceResearchId),
        role: "supports",
        captureKind: "paraphrase",
        excerpt: null,
      },
    ];
  }

  async run() {
    const tx = this.tx;
    const R = this.rows;

    /* ---------- reference data ---------- */

    for (const o of R.organizations) {
      const { id } = await this.upsert("organizations", { slug: o.org_id }, { name: o.name, type: o.type, website: o.website });
      this.orgId.set(str(o, "org_id")!, id);
      this.orgByName.set(str(o, "name")!, id);
    }

    const pending = [...R.capabilities];
    const placed = new Set<string>();
    while (pending.length) {
      const i = pending.findIndex((c) => !c.parent_id || placed.has(str(c, "parent_id")!));
      if (i < 0) throw new Error(`capability parents form a cycle: ${pending.map((c) => c.capability_id).join(", ")}`);
      const [c] = pending.splice(i, 1);
      await this.upsert("capabilities", { slug: c.capability_id }, { axis: c.axis, name: c.name, description: c.description, parent_slug: c.parent_id }, "slug");
      placed.add(str(c, "capability_id")!);
    }

    for (const l of R.licenses) {
      await this.upsert("licenses", { slug: l.license_id }, { name: l.name, spdx_id: l.spdx_id, category: l.category, url: l.url }, "slug");
    }

    for (const m of R.metric_definitions) {
      await this.upsert(
        "metric_definitions",
        { id: m.metric_id },
        { scope: m.scope, name: m.name, unit: m.unit, direction: m.direction, aggregation: m.aggregation, denominator: m.denominator, description: m.description },
      );
    }

    for (const m of R.models) {
      const { id } = await this.upsert("models", { slug: m.model_id }, { name: m.name, provider_id: this.orgId.get(str(m, "provider_org_id")!), open_weights: m.open_weights });
      this.modelId.set(str(m, "model_id")!, id);
    }

    /* ---------- sources: one immutable snapshot per retrieval ---------- */

    for (const s of R.sources) {
      const url = str(s, "url")!;
      const { id } = await this.upsert(
        "sources",
        { key: s.source_id },
        {
          canonical_url: url,
          title: s.title,
          // Document type only when the URL makes it evident; otherwise unknown.
          kind: /^https:\/\/github\.com\//.test(url) ? "repository" : /^https:\/\/arxiv\.org\//.test(url) ? "paper" : null,
          publisher_id: s.publisher ? (this.orgByName.get(str(s, "publisher")!) ?? null) : null,
          publisher_name: s.publisher,
          published_on: s.published_on,
          published_precision: s.published_on ? "day" : null,
          provenance: s.source_kind,
          locator: s.locator,
        },
      );
      this.sourceId.set(str(s, "source_id")!, id);
      const snap = await this.upsert(
        "source_snapshots",
        { source_id: id, retrieved_on: s.checked_on, content_hash: s.content_hash },
        { adapter: s.access_method, snapshot_path: s.snapshot_path },
      );
      this.snapshotId.set(str(s, "source_id")!, snap.id);
    }

    /* ---------- registry entries ---------- */

    for (const b of R.benchmarks) {
      const bid = str(b, "benchmark_id")!;
      this.familyRow.set(bid, b);
      const [prev] = await tx`select review_state from benchmarks.benchmark_families where research_id = ${bid}`;
      const maintainer = R.claims.find((c) => c.benchmark_id === bid && !c.version_id && c.predicate === "maintainer");
      const { id } = await this.upsert(
        "benchmark_families",
        { research_id: bid },
        {
          slug: b.slug,
          name: b.name,
          kind: b.entity_kind,
          editorial_track: b.editorial_track,
          research_priority: b.research_priority,
          summary: b.summary,
          primary_source_id: b.primary_source_id ? this.sourceId.get(str(b, "primary_source_id")!) : null,
          identity_status: b.identity_status,
          profile_status: b.profile_status,
          checked_on: b.checked_on,
          research_notes: b.notes,
          status: b.maintenance_status ?? "unknown",
          maintainer_id: maintainer ? (this.orgId.get(str(maintainer, "value")!) ?? null) : null,
          review_state: b.review_state,
          reviewed_at: b.reviewed_on,
        },
      );
      this.familyId.set(bid, id);
      await this.reviewEvent(id, (prev?.review_state as string) ?? null, str(b, "review_state")!);
    }

    for (const [bid, fid] of this.familyId) {
      const aliases = R.benchmark_aliases.filter((a) => a.benchmark_id === bid).map((a) => str(a, "alias")!);
      await this.prune("benchmark_aliases", "alias", aliases, tx`family_id = ${fid}`);
      for (const alias of aliases) await this.upsert("benchmark_aliases", { family_id: fid, alias }, {});

      const caps = R.benchmark_capabilities.filter((c) => c.benchmark_id === bid);
      await this.prune("benchmark_capabilities", "capability_slug", caps.map((c) => str(c, "capability_id")!), tx`family_id = ${fid}`);
      // Clear primaries first so "primary" can move between capabilities without tripping the unique index.
      const primary = caps.find((c) => c.is_primary)?.capability_id ?? "";
      await tx`update benchmarks.benchmark_capabilities set is_primary = false where family_id = ${fid} and is_primary and capability_slug <> ${primary as string}`;
      for (const c of caps) {
        await this.upsert("benchmark_capabilities", { family_id: fid, capability_slug: c.capability_id }, { is_primary: c.is_primary }, "capability_slug");
      }
    }

    /* ---------- versions & splits (facts become sourced claims) ---------- */

    for (const v of R.versions) {
      const vid = str(v, "version_id")!;
      const bid = str(v, "benchmark_id")!;
      const family = this.familyRow.get(bid)!;
      const { id } = await this.upsert(
        "benchmark_versions",
        { research_id: vid },
        {
          family_id: this.familyId.get(bid),
          label: v.version_label,
          released_on: v.release_date,
          released_precision: v.release_date ? "day" : null,
          release_date_basis: v.date_basis,
          task_count: v.task_count,
          revision_hash: v.revision_hash,
          pin_status: v.pin_status,
        },
      );
      this.versionId.set(vid, id);
      const name = `${family.name} ${v.version_label}`;
      if (v.release_date) {
        await this.writeClaim({
          key: `${vid}/released_on`,
          benchmarkId: bid,
          subjectId: id,
          field: "released_on",
          statement: `${name} was released on ${v.release_date}${v.date_basis ? ` (basis: ${v.date_basis})` : ""}.`,
          valueDate: str(v, "release_date"),
          status: "reported",
          checkedOn: str(this.rows.sources.find((s) => s.source_id === v.source_id)!, "checked_on"),
          evidence: this.rowEvidence(str(v, "source_id")!),
        });
      }
      // An explicit task_count claim in claims.csv backs the column; otherwise the version's source does.
      const explicit = R.claims.some((c) => c.version_id === vid && c.predicate === "task_count");
      if (v.task_count !== null && !explicit) {
        await this.writeClaim({
          key: `${vid}/task_count`,
          benchmarkId: bid,
          subjectId: id,
          field: "task_count",
          statement: `${name} has ${v.task_count} tasks.`,
          valueNumeric: v.task_count as number,
          unit: "tasks",
          status: "reported",
          evidence: this.rowEvidence(str(v, "source_id")!),
        });
      }
    }
    for (const fam of this.familyId.values()) {
      const stale = await tx`
        select label from benchmarks.benchmark_versions
        where family_id = ${fam} and (research_id is null or not (research_id = any(${[...this.versionId.keys()]}::text[])))`;
      for (const s of stale) this.warnings.push(`version "${s.label}" is in the database but not in versions.csv (kept)`);
    }

    for (const sp of R.splits) {
      const versionResearchId = str(sp, "version_id")!;
      const version = R.versions.find((v) => v.version_id === versionResearchId)!;
      const { id } = await this.upsert(
        "benchmark_splits",
        { research_id: sp.split_id },
        { version_id: this.versionId.get(versionResearchId), name: sp.name, visibility: sp.visibility, task_count: sp.task_count },
      );
      this.splitId.set(str(sp, "split_id")!, id);
      if (sp.task_count !== null) {
        await this.writeClaim({
          key: `${sp.split_id}/task_count`,
          benchmarkId: str(version, "benchmark_id")!,
          subjectId: id,
          field: "task_count",
          statement: `The ${sp.name} split of ${versionResearchId} has ${sp.task_count} tasks.`,
          valueNumeric: sp.task_count as number,
          unit: "tasks",
          status: "reported",
          evidence: this.rowEvidence(str(sp, "source_id")!),
        });
      }
    }

    /* ---------- claims & evidence ---------- */

    for (const c of R.claims) {
      const cid = str(c, "claim_id")!;
      const bid = str(c, "benchmark_id")!;
      const vid = str(c, "version_id");
      const value = str(c, "value")!;
      const predicate = str(c, "predicate")!;
      const evidence = R.claim_evidence
        .filter((e) => e.claim_id === cid)
        .map((e) => ({
          researchId: str(e, "evidence_id"),
          snapshotId: this.snapshotOf(str(e, "source_id")!),
          locator: str(e, "locator")!,
          role: str(e, "evidence_role")!,
          captureKind: str(e, "capture_kind")!,
          excerpt: str(e, "excerpt"),
        }));
      const id = await this.writeClaim({
        key: cid,
        benchmarkId: bid,
        subjectId: vid ? this.versionId.get(vid)! : this.familyId.get(bid)!,
        field: predicate,
        statement: predicate === "scope_summary" ? value : `${predicate.replace(/_/g, " ")}: ${value}${c.unit ? ` ${c.unit}` : ""}`,
        valueText: c.value_type === "text" ? value : null,
        valueNumeric: c.value_type === "number" ? Number(value) : null,
        valueDate: c.value_type === "date" ? value : null,
        unit: str(c, "unit"),
        status: str(c, "verification_status")!,
        checkedOn: str(c, "checked_on"),
        notes: str(c, "notes"),
        evidence,
      });
      this.claimId.set(cid, id);
    }

    /* ---------- relationships (each backed by a claim) ---------- */

    for (const r of R.relationships) {
      const rid = str(r, "relationship_id")!;
      const from = str(r, "from_benchmark_id")!;
      const to = str(r, "to_benchmark_id")!;
      const claim = await this.writeClaim({
        key: rid,
        benchmarkId: from,
        subjectId: this.familyId.get(from)!,
        field: "relationship",
        statement: `${this.familyRow.get(from)!.name} ${str(r, "relationship_type")!.replace(/_/g, " ")} ${this.familyRow.get(to)!.name}.`,
        valueText: `${r.relationship_type}:${to}`,
        status: "reported",
        evidence: this.rowEvidence(str(r, "source_id")!),
      });
      await this.upsert(
        "benchmark_relationships",
        { research_id: rid },
        { subject_family_id: this.familyId.get(from), kind: r.relationship_type, object_family_id: this.familyId.get(to), claim_id: claim },
        "research_id",
      );
    }
    await this.prune("benchmark_relationships", "research_id", R.relationships.map((r) => str(r, "relationship_id")!));

    /* ---------- citations, audits ---------- */

    for (const c of R.citations) {
      const [y, m, d] = str(c, "cited_on")!.split("-");
      await this.upsert(
        "benchmark_citations",
        { key: c.citation_id },
        {
          family_id: this.familyId.get(str(c, "benchmark_id")!),
          version_id: c.version_id ? this.versionId.get(str(c, "version_id")!) : null,
          citing_org_id: this.orgId.get(str(c, "citing_org_id")!),
          model_id: c.model_id ? this.modelId.get(str(c, "model_id")!) : null,
          kind: c.citation_kind,
          cited_on: [y, m ?? "01", d ?? "01"].join("-"),
          cited_precision: d ? "day" : m ? "month" : "year",
          claim_id: this.claimId.get(str(c, "claim_id")!),
        },
      );
    }
    await this.prune("benchmark_citations", "key", R.citations.map((c) => str(c, "citation_id")!));

    for (const a of R.audits) {
      await this.upsert(
        "benchmark_audits",
        { key: a.audit_id },
        {
          family_id: this.familyId.get(str(a, "benchmark_id")!),
          version_id: a.version_id ? this.versionId.get(str(a, "version_id")!) : null,
          auditor_id: this.orgByName.get(str(a, "auditor")!) ?? null,
          auditor_name: a.auditor,
          audit_date: a.audit_date,
          verdict: a.verdict,
          affected_tasks_lower_bound: a.affected_tasks_lower_bound,
          review_task_count: a.review_task_count,
          summary: a.summary,
          remediation_status: a.remediation_status,
          claim_id: this.claimId.get(str(a, "claim_id")!),
        },
      );
    }
    await this.prune("benchmark_audits", "key", R.audits.map((a) => str(a, "audit_id")!));

    /* ---------- metric snapshots, research gaps, result observations ---------- */

    for (const m of R.metric_snapshots) {
      await this.upsert(
        "metric_snapshots",
        { research_id: m.snapshot_id },
        {
          subject_id: this.familyId.get(str(m, "benchmark_id")!),
          metric_id: m.metric,
          value: m.value,
          value_display: m.value_display,
          precision: m.precision,
          observed_on: m.observed_on,
          source_snapshot_id: m.source_id ? this.snapshotOf(str(m, "source_id")!) : null,
        },
      );
    }
    // Only rows this package owns (adapters will add rows without a research_id).
    await this.prune("metric_snapshots", "research_id", R.metric_snapshots.map((m) => str(m, "snapshot_id")!));

    for (const g of R.research_gaps) {
      await this.upsert(
        "research_gaps",
        { key: g.gap_id },
        { family_id: this.familyId.get(str(g, "benchmark_id")!), priority: g.priority, gap_type: g.gap_type, status: g.status, next_action: g.next_action },
      );
    }
    await this.prune("research_gaps", "key", R.research_gaps.map((g) => str(g, "gap_id")!));

    for (const o of R.result_observations) {
      await this.upsert(
        "result_observations",
        { key: o.observation_id },
        {
          family_id: this.familyId.get(str(o, "benchmark_id")!),
          version_id: o.version_id ? this.versionId.get(str(o, "version_id")!) : null,
          source_snapshot_id: this.snapshotOf(str(o, "source_id")!),
          source_locator: o.source_locator,
          model_label: o.model_label,
          effort_label: o.effort_label,
          agent_label: o.agent_label,
          score_percent: o.score_percent,
          interval_halfwidth_pp: o.interval_halfwidth_pp,
          score_display: o.score_display,
          average_cost_usd: o.average_cost_usd,
          output_tokens_display: o.output_tokens_display,
          steps_display: o.steps_display,
          source_updated_on: o.source_updated_on,
          observed_on: o.observed_on,
          precision: o.precision,
          origin: o.origin,
          comparison_status: o.comparison_status,
          missing_context: o.missing_context,
        },
      );
    }
    await this.prune("result_observations", "key", R.result_observations.map((o) => str(o, "observation_id")!));

    /* ---------- retraction (never delete editorial history) ---------- */

    const retractedClaims = await tx`
      update benchmarks.claims c set review_state = 'retracted'
      from (
        select id, review_state as was from benchmarks.claims
        where key like ${CLAIM_PREFIX + "%"} and review_state <> 'retracted' and not (key = any(${[...this.seenClaims]}::text[]))
        for update
      ) p
      where c.id = p.id
      returning c.id, p.was`;
    for (const c of retractedClaims) {
      this.tally("claims", "retracted");
      await this.reviewEvent(c.id as string, c.was as string, "retracted", "removed from research files");
    }
    const retractedFamilies = await tx`
      update benchmarks.benchmark_families f set review_state = 'retracted'
      from (
        select id, review_state as was from benchmarks.benchmark_families
        where review_state <> 'retracted' and not (research_id = any(${[...this.familyId.keys()]}::text[]))
        for update
      ) p
      where f.id = p.id
      returning f.id, p.was`;
    for (const f of retractedFamilies) {
      this.tally("benchmark_families", "retracted");
      await this.reviewEvent(f.id as string, f.was as string, "retracted", "removed from benchmarks.csv");
    }

    /* ---------- Frontier runs ---------- */

    for (const run of this.bundle.runs) await this.writeRun(run);
  }

  private async writeRun(run: RunImportV1) {
    const tx = this.tx;
    if (run.fixture && !this.opts.allowFixtures) {
      throw new Error(`run ${run.experiment_id} is a fixture; fixtures are never imported as real evaluations`);
    }
    const importHash = sha256Of(run);
    const [existing] = await tx`select import_hash from benchmarks.evaluation_runs where key = ${run.experiment_id}`;
    if (existing) {
      if (existing.import_hash !== importHash) {
        throw new Error(`run ${run.experiment_id} was already imported with different content; runs are immutable — use a new experiment_id`);
      }
      this.tally("evaluation_runs", "unchanged");
      return;
    }

    const insertOnce = async (table: string, hashCol: string, row: Values): Promise<string> => {
      const r = nulls(row);
      await tx`insert into ${tx("benchmarks." + table)} ${tx(r, Object.keys(r))} on conflict (${tx(hashCol)}) do nothing`;
      const [found] = await tx`select id from ${tx("benchmarks." + table)} where ${tx(hashCol)} = ${r[hashCol] as string}`;
      return String(found.id);
    };

    const mc = run.model.config;
    const modelConfigId = await insertOnce("model_configs", "config_hash", {
      model_id: this.modelId.get(run.model.model_id),
      config_hash: sha256Of({ model: run.model.model_id, ...mc }),
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

    const runRow = nulls({
      key: run.experiment_id,
      version_id: this.versionId.get(run.benchmark.version_id),
      split_id: run.benchmark.split_id ? this.splitId.get(run.benchmark.split_id) : null,
      model_config_id: modelConfigId,
      agent_config_id: agentId,
      environment_id: envId,
      evaluator_id: this.orgId.get(run.evaluator),
      origin: "frontier_run",
      status: run.status,
      repetitions: run.protocol.repetitions,
      grader: run.protocol.grader,
      protocol_hash: run.protocol.protocol_hash,
      started_at: run.timestamps.started_at,
      completed_at: run.timestamps.completed_at,
      import_hash: importHash,
      is_fixture: run.fixture,
      ingestion_job_id: this.jobId,
      notes: run.protocol.notes,
    });
    const [{ id: runId }] = await tx`insert into benchmarks.evaluation_runs ${tx(runRow, Object.keys(runRow))} returning id`;
    this.tally("evaluation_runs", "created");

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
      this.tally("evaluation_results", "created");
    }

    const { tokens, ...usage } = run.usage;
    if (Object.keys(usage).length) {
      const u = nulls({ run_id: runId, ...usage });
      await tx`insert into benchmarks.run_usage ${tx(u, Object.keys(u))}`;
      this.tally("run_usage", "created");
    }
    for (const [category, count] of Object.entries(tokens)) {
      await tx`insert into benchmarks.run_token_usage (run_id, category, tokens) values (${runId as string}, ${category}, ${count})`;
      this.tally("run_token_usage", "created");
    }
    for (const a of run.artifacts) {
      const r = nulls({ run_id: runId, kind: a.kind, url: a.url, sha256: a.sha256, bytes: a.bytes });
      await tx`insert into benchmarks.run_artifacts ${tx(r, Object.keys(r))}`;
      this.tally("run_artifacts", "created");
    }
  }
}
