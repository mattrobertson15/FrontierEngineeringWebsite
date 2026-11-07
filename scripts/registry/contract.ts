/**
 * Import contract for the Benchmark Intelligence Directory.
 *
 * The editorial master is the relational CSV package in research/ (one file per table, stable
 * text ids, RFC-4180, empty cell = NULL). `tables` below is the contract for every file: column
 * order, types, required columns, vocabularies and references. research/manifest.json is
 * generated from it (`npm run registry:manifest`) and the validator fails if it is stale.
 *
 * Frontier evaluation runs stay JSON (research/runs/<experiment>.json, contract frontier-run/v1)
 * because they carry nested configurations.
 *
 * Enum lists mirror the Postgres enums in db/migrations; a test fails if they drift.
 */
import { createHash } from "node:crypto";
import { z } from "zod";

/* ---------- enums (must match the database) ---------- */

export const organizationTypes = ["lab", "academic", "company", "nonprofit", "independent", "government"] as const;
export const benchmarkKinds = [
  "benchmark", "suite", "framework", "evaluation_study", "index", "unclassified",
  "variant", "benchmark_family", "evaluation_environment", "benchmark_and_agent", "benchmark_and_platform",
] as const;
export const maintenanceStatuses = ["active", "unmaintained", "superseded", "deprecated", "unknown"] as const;
export const researchPriorities = ["pilot", "launch", "expand", "supporting", "backlog"] as const;
export const reviewStates = ["draft", "in_review", "published", "retracted"] as const;
export const editorialTracks = ["coding", "agents", "enterprise", "reliability"] as const;
export const identityStatuses = ["not_checked", "primary_source_located"] as const;
export const profileStatuses = ["registry_only", "pilot_draft", "profile_draft", "profile_complete"] as const;
export const pinStatuses = ["label_only", "source_short_commit", "pinned"] as const;
export const splitVisibilities = ["public", "semi_private", "private", "unknown"] as const;
export const capabilityAxes = ["capability", "domain"] as const;
export const relationshipKinds = ["variant_of", "derived_from", "successor_of", "subset_of", "related_to"] as const;
export const resourceKinds = ["paper", "repository", "dataset", "harness", "website", "leaderboard", "documentation"] as const;
export const licenseCategories = ["permissive", "copyleft", "non_commercial", "proprietary", "custom", "unknown"] as const;
export const verificationStatuses = ["verified", "reported", "estimated", "unverified"] as const;
export const evidenceRoles = ["supports", "disputes", "context"] as const;
export const captureKinds = ["paraphrase", "quotation"] as const;
export const sourceKinds = [
  "paper", "model_card", "system_card", "blog_post", "leaderboard", "repository",
  "dataset_card", "documentation", "news", "other",
] as const;
export const sourceProvenances = ["primary", "independent_audit", "secondary"] as const;
export const citationKinds = ["mention", "explicit_adoption", "score_report", "reproduction", "audit", "frontier_run"] as const;
export const metricScopes = ["evaluation", "engagement"] as const;
export const metricDirections = ["higher_is_better", "lower_is_better", "neutral"] as const;
export const valuePrecisions = ["exact", "rounded", "displayed_integer", "rounded_display"] as const;
export const remediationStatuses = ["not_checked", "open", "acknowledged", "resolved", "wont_fix", "disputed"] as const;
export const gapPriorities = ["P0", "P1", "P2"] as const;
export const gapStatuses = ["open", "in_progress", "resolved", "wont_fix"] as const;
export const comparisonStatuses = ["not_ready", "ready", "excluded"] as const;
export const resultOrigins = ["publisher_reported", "independent_reproduction", "frontier_run"] as const;
export const runStatuses = ["planned", "running", "completed", "incomplete", "failed", "cancelled"] as const;
export const tokenCategories = ["input", "cache_read", "cache_write", "reasoning", "output"] as const;
export const artifactKinds = ["log", "config", "results", "trajectory", "other"] as const;
export const claimValueTypes = ["text", "number", "date"] as const;

/** Every TS enum list keyed by its Postgres type name, for the drift test. */
export const dbEnums: Record<string, readonly string[]> = {
  organization_type: organizationTypes,
  benchmark_kind: benchmarkKinds,
  maintenance_status: maintenanceStatuses,
  research_priority: researchPriorities,
  review_state: reviewStates,
  editorial_track: editorialTracks,
  identity_status: identityStatuses,
  profile_status: profileStatuses,
  pin_status: pinStatuses,
  split_visibility: splitVisibilities,
  capability_axis: capabilityAxes,
  relationship_kind: relationshipKinds,
  resource_kind: resourceKinds,
  license_category: licenseCategories,
  verification_status: verificationStatuses,
  evidence_role: evidenceRoles,
  capture_kind: captureKinds,
  source_kind: sourceKinds,
  source_provenance: sourceProvenances,
  citation_kind: citationKinds,
  metric_scope: metricScopes,
  metric_direction: metricDirections,
  value_precision: valuePrecisions,
  remediation_status: remediationStatuses,
  gap_priority: gapPriorities,
  gap_status: gapStatuses,
  comparison_status: comparisonStatuses,
  result_origin: resultOrigins,
  run_status: runStatuses,
  token_category: tokenCategories,
  artifact_kind: artifactKinds,
};

/* ---------- patterns ---------- */

export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** Stable research ids: lowercase letters, digits and . _ - (e.g. s_deep_repo, deepswe-v1.1). */
export const RESEARCH_ID = /^[a-z0-9]+([._-][a-z0-9]+)*$/;
export const SNAKE = /^[a-z][a-z0-9_]*$/;
const URL_RE = /^https?:\/\/\S+$/;
const SHA256 = /^[0-9a-f]{64}$/;
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const PARTIAL_DATE = /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/;

/* ---------- table specs ---------- */

export type ColumnType = "text" | "integer" | "number" | "date" | "partial_date" | "boolean";
export type Column = {
  name: string;
  type: ColumnType;
  nullable?: boolean;
  enum?: readonly string[];
  pattern?: RegExp;
  max?: number;
};
export type TableSpec = {
  file: string;
  /** Primary key column(s). */
  key: string[];
  columns: Column[];
  /** [column, table, column] */
  refs: [string, string, string][];
  /** One-line meaning of a row, for the manifest. */
  row: string;
};

const id = (name: string, pattern = RESEARCH_ID): Column => ({ name, type: "text", pattern });
const ref = (name: string, nullable = false): Column => ({ name, type: "text", pattern: RESEARCH_ID, nullable });
const text = (name: string, nullable = false, extra: Partial<Column> = {}): Column => ({ name, type: "text", nullable, ...extra });
const oneOf = (name: string, values: readonly string[], nullable = false): Column => ({ name, type: "text", enum: values, nullable });
const date = (name: string, nullable = false): Column => ({ name, type: "date", nullable });

/** Import order: every table appears after the tables it references. */
export const tables = {
  organizations: {
    file: "organizations.csv",
    row: "An organization: maintainer, publisher, model provider, evaluator or citing lab",
    key: ["org_id"],
    columns: [id("org_id", SLUG), text("name"), oneOf("type", organizationTypes), text("website", true, { pattern: URL_RE })],
    refs: [],
  },
  capabilities: {
    file: "capabilities.csv",
    row: "A capability (what is tested) or domain (where tasks come from) in the taxonomy",
    key: ["capability_id"],
    columns: [id("capability_id", SLUG), oneOf("axis", capabilityAxes), text("name"), text("description", true), text("parent_id", true, { pattern: SLUG })],
    refs: [["parent_id", "capabilities", "capability_id"]],
  },
  licenses: {
    file: "licenses.csv",
    row: "A license that a benchmark resource may carry",
    key: ["license_id"],
    columns: [id("license_id"), text("name"), text("spdx_id", true), oneOf("category", licenseCategories), text("url", true, { pattern: URL_RE })],
    refs: [],
  },
  metric_definitions: {
    file: "metric_definitions.csv",
    row: "A metric: engagement (popularity of a benchmark) or evaluation (result of a run)",
    key: ["metric_id"],
    columns: [
      id("metric_id", SNAKE), oneOf("scope", metricScopes), text("name"), text("unit"), oneOf("direction", metricDirections),
      text("aggregation", true), text("denominator", true), text("description", true),
    ],
    refs: [],
  },
  models: {
    file: "models.csv",
    row: "A model identity referenced by citations and runs",
    key: ["model_id"],
    columns: [id("model_id"), text("name"), ref("provider_org_id"), { name: "open_weights", type: "boolean", nullable: true }],
    refs: [["provider_org_id", "organizations", "org_id"]],
  },
  sources: {
    file: "sources.csv",
    row: "A retrieved source document or page, with a retrieval date and evidence locator",
    key: ["source_id"],
    columns: [
      id("source_id"), text("url", false, { pattern: URL_RE }), text("title"), text("publisher", true), date("published_on", true),
      date("checked_on"), oneOf("source_kind", sourceProvenances), text("access_method"), text("locator", true),
      text("snapshot_path", true), text("content_hash", true, { pattern: SHA256 }),
    ],
    refs: [],
  },
  benchmarks: {
    file: "benchmarks.csv",
    row: "A named registry entity: benchmark, variant, family, framework or evaluation study",
    key: ["benchmark_id"],
    columns: [
      id("benchmark_id", SLUG), text("slug", false, { pattern: SLUG }), text("name"), oneOf("entity_kind", benchmarkKinds),
      oneOf("editorial_track", editorialTracks, true), oneOf("research_priority", researchPriorities),
      text("summary", true, { max: 280 }), ref("primary_source_id", true), oneOf("identity_status", identityStatuses),
      oneOf("profile_status", profileStatuses), date("checked_on", true), text("notes", true),
      oneOf("maintenance_status", maintenanceStatuses, true), oneOf("review_state", reviewStates), date("reviewed_on", true),
    ],
    refs: [["primary_source_id", "sources", "source_id"]],
  },
  benchmark_aliases: {
    file: "benchmark_aliases.csv",
    row: "Another name that should resolve to one registry entry (unique across all names)",
    key: ["alias"],
    columns: [text("alias"), ref("benchmark_id")],
    refs: [["benchmark_id", "benchmarks", "benchmark_id"]],
  },
  benchmark_capabilities: {
    file: "benchmark_capabilities.csv",
    row: "A registry entry tagged with a capability or domain; at most one primary per entry",
    key: ["benchmark_id", "capability_id"],
    columns: [ref("benchmark_id"), text("capability_id", false, { pattern: SLUG }), { name: "is_primary", type: "boolean" }],
    refs: [["benchmark_id", "benchmarks", "benchmark_id"], ["capability_id", "capabilities", "capability_id"]],
  },
  versions: {
    file: "versions.csv",
    row: "An explicitly identified version of one registry entity",
    key: ["version_id"],
    columns: [
      id("version_id"), ref("benchmark_id"), text("version_label"), date("release_date", true), text("date_basis", true),
      { name: "task_count", type: "integer", nullable: true }, ref("source_id", true), text("revision_hash", true),
      oneOf("pin_status", pinStatuses),
    ],
    refs: [["benchmark_id", "benchmarks", "benchmark_id"], ["source_id", "sources", "source_id"]],
  },
  splits: {
    file: "splits.csv",
    row: "A named split of one version (only when a source names it)",
    key: ["split_id"],
    columns: [
      id("split_id"), ref("version_id"), text("name"), oneOf("visibility", splitVisibilities),
      { name: "task_count", type: "integer", nullable: true }, ref("source_id", true),
    ],
    refs: [["version_id", "versions", "version_id"], ["source_id", "sources", "source_id"]],
  },
  claims: {
    file: "claims.csv",
    row: "A single attributed statement about an entity or version",
    key: ["claim_id"],
    columns: [
      id("claim_id"), ref("benchmark_id"), ref("version_id", true), text("predicate", false, { pattern: SNAKE }), text("value"),
      oneOf("value_type", claimValueTypes), text("unit", true), oneOf("verification_status", verificationStatuses),
      date("checked_on", true), text("notes", true),
    ],
    refs: [["benchmark_id", "benchmarks", "benchmark_id"], ["version_id", "versions", "version_id"]],
  },
  claim_evidence: {
    file: "claim_evidence.csv",
    row: "One source supporting (or disputing) one claim",
    key: ["evidence_id"],
    columns: [
      id("evidence_id"), ref("claim_id"), ref("source_id"), text("locator"), oneOf("evidence_role", evidenceRoles),
      oneOf("capture_kind", captureKinds), text("excerpt", true, { max: 500 }),
    ],
    refs: [["claim_id", "claims", "claim_id"], ["source_id", "sources", "source_id"]],
  },
  relationships: {
    file: "relationships.csv",
    row: "A documented, sourced relationship between two registry entities",
    key: ["relationship_id"],
    columns: [id("relationship_id"), ref("from_benchmark_id"), oneOf("relationship_type", relationshipKinds), ref("to_benchmark_id"), ref("source_id")],
    refs: [["from_benchmark_id", "benchmarks", "benchmark_id"], ["to_benchmark_id", "benchmarks", "benchmark_id"], ["source_id", "sources", "source_id"]],
  },
  citations: {
    file: "citations.csv",
    row: "One lab or organization citing a benchmark in one experiment (evidence via its claim)",
    key: ["citation_id"],
    columns: [
      id("citation_id"), ref("benchmark_id"), ref("version_id", true), text("citing_org_id", false, { pattern: SLUG }), ref("model_id", true),
      oneOf("citation_kind", citationKinds), { name: "cited_on", type: "partial_date" }, ref("claim_id"),
    ],
    refs: [
      ["benchmark_id", "benchmarks", "benchmark_id"], ["version_id", "versions", "version_id"], ["citing_org_id", "organizations", "org_id"],
      ["model_id", "models", "model_id"], ["claim_id", "claims", "claim_id"],
    ],
  },
  result_observations: {
    file: "result_observations.csv",
    row: "A publisher-displayed result awaiting configuration reconciliation (staging; never ranked)",
    key: ["observation_id"],
    columns: [
      id("observation_id"), ref("benchmark_id"), ref("version_id", true), ref("source_id"), text("source_locator"), text("model_label"),
      text("effort_label", true), text("agent_label", true), { name: "score_percent", type: "number", nullable: true },
      { name: "interval_halfwidth_pp", type: "number", nullable: true }, text("score_display", true),
      { name: "average_cost_usd", type: "number", nullable: true }, text("output_tokens_display", true), text("steps_display", true),
      date("source_updated_on", true), date("observed_on"), oneOf("precision", valuePrecisions), oneOf("origin", resultOrigins),
      oneOf("comparison_status", comparisonStatuses), text("missing_context", true),
    ],
    refs: [["benchmark_id", "benchmarks", "benchmark_id"], ["version_id", "versions", "version_id"], ["source_id", "sources", "source_id"]],
  },
  audits: {
    file: "audits.csv",
    row: "An auditor's attributed finding about a specific version",
    key: ["audit_id"],
    columns: [
      id("audit_id"), ref("benchmark_id"), ref("version_id", true), text("auditor"), date("audit_date", true), text("verdict"),
      { name: "affected_tasks_lower_bound", type: "integer", nullable: true }, { name: "review_task_count", type: "integer", nullable: true },
      ref("claim_id"), ref("source_id"), text("summary", true), oneOf("remediation_status", remediationStatuses),
    ],
    refs: [
      ["benchmark_id", "benchmarks", "benchmark_id"], ["version_id", "versions", "version_id"],
      ["claim_id", "claims", "claim_id"], ["source_id", "sources", "source_id"],
    ],
  },
  metric_snapshots: {
    file: "metric_snapshots.csv",
    row: "A dated, source-specific popularity observation",
    key: ["snapshot_id"],
    columns: [
      id("snapshot_id"), ref("benchmark_id"), text("metric", false, { pattern: SNAKE }), { name: "value", type: "number" },
      text("value_display", true), oneOf("precision", valuePrecisions), ref("source_id", true), date("observed_on"),
    ],
    refs: [["benchmark_id", "benchmarks", "benchmark_id"], ["metric", "metric_definitions", "metric_id"], ["source_id", "sources", "source_id"]],
  },
  research_gaps: {
    file: "research_gaps.csv",
    row: "One unresolved research action",
    key: ["gap_id"],
    columns: [id("gap_id"), ref("benchmark_id"), oneOf("priority", gapPriorities), text("gap_type", false, { pattern: SNAKE }), oneOf("status", gapStatuses), text("next_action")],
    refs: [["benchmark_id", "benchmarks", "benchmark_id"]],
  },
} satisfies Record<string, TableSpec>;

export type TableName = keyof typeof tables;
export const tableNames = Object.keys(tables) as TableName[];

export type Cell = string | number | boolean | null;
export type Row = Record<string, Cell>;

/* ---------- CSV (RFC 4180) ---------- */

/** Parses CSV text. Empty cells (quoted or not) are returned as "" — callers treat "" as NULL. */
export function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        quoted = false;
      } else cell += ch;
      i++;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      if (ch === "\r" && text[i + 1] === "\n") i++;
    } else cell += ch;
    i++;
  }
  if (quoted) throw new Error("unterminated quoted field");
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/** Serializes in the package's style: non-empty values quoted, NULL as an empty unquoted cell. */
export function toCsv(header: string[], rows: Row[]): string {
  const cell = (v: Cell) => (v === null || v === "" ? "" : `"${String(v).replace(/"/g, '""')}"`);
  return [header.map(cell).join(","), ...rows.map((r) => header.map((h) => cell(r[h] ?? null)).join(","))].join("\n") + "\n";
}

/* ---------- partial dates ---------- */

export type Precision = "year" | "month" | "day";
export function parsePartialDate(s: string): { date: string; precision: Precision } {
  const parts = s.split("-");
  const precision: Precision = parts.length === 1 ? "year" : parts.length === 2 ? "month" : "day";
  return { date: [parts[0], parts[1] ?? "01", parts[2] ?? "01"].join("-"), precision };
}

/** Validates and converts one raw cell. Returns [value, problem]. */
export function convertCell(col: Column, raw: string): [Cell, string | null] {
  if (raw === "") return [null, col.nullable ? null : "is required"];
  switch (col.type) {
    case "integer":
      return /^-?\d+$/.test(raw) ? [Number(raw), null] : [null, `"${raw}" is not an integer`];
    case "number":
      return /^-?\d+(\.\d+)?$/.test(raw) ? [Number(raw), null] : [null, `"${raw}" is not a number`];
    case "boolean":
      return raw === "true" || raw === "false" ? [raw === "true", null] : [null, `"${raw}" must be true or false`];
    case "date":
      return DATE.test(raw) ? [raw, null] : [null, `"${raw}" is not an ISO date (YYYY-MM-DD)`];
    case "partial_date":
      return PARTIAL_DATE.test(raw) ? [raw, null] : [null, `"${raw}" must be YYYY, YYYY-MM or YYYY-MM-DD`];
    case "text":
      if (col.enum && !col.enum.includes(raw)) return [null, `"${raw}" is not one of ${col.enum.join(", ")}`];
      if (col.pattern && !col.pattern.test(raw)) return [null, `"${raw}" does not match ${col.pattern}`];
      if (col.max && raw.length > col.max) return [null, `is ${raw.length} characters; the limit is ${col.max}`];
      return [raw, null];
  }
}

/* ---------- manifest ---------- */

export function buildManifest(rows: Record<TableName, Row[]>, meta: { schema_version: string; research_date: string; package_status: string }) {
  return {
    ...meta,
    tables: Object.fromEntries(
      tableNames.map((t) => [
        t,
        {
          file: tables[t].file,
          rows: rows[t].length,
          primary_key: tables[t].key.length === 1 ? tables[t].key[0] : tables[t].key,
          row: tables[t].row,
          columns: (tables[t].columns as Column[]).map((c) => ({
            name: c.name,
            type: c.type,
            nullable: !!c.nullable,
            ...(c.enum ? { values: [...c.enum] } : {}),
          })),
        },
      ]),
    ),
    foreign_keys: tableNames.flatMap((t) => tables[t].refs.map(([col, toTable, toCol]) => [t, col, toTable, toCol])),
  };
}

/* ---------- Frontier run import contract (JSON) ---------- */

const nonNeg = z.number().nonnegative();
const sha256 = z.string().regex(SHA256, "lowercase hex sha256");
const isoDateTime = z.iso.datetime({ offset: true });

export const RunImportV1 = z.strictObject({
  contract: z.literal("frontier-run/v1"),
  /** Stable experiment id. Re-importing the same id must carry an identical payload. */
  experiment_id: z.string().regex(/^[a-z0-9]+([._-][a-z0-9]+)*$/),
  /** True only for test fixtures. Fixtures are rejected unless the importer is told to allow them. */
  fixture: z.boolean().default(false),
  /** Research ids: benchmarks.csv benchmark_id, versions.csv version_id, splits.csv split_id (or null). */
  benchmark: z.strictObject({ benchmark_id: z.string().regex(SLUG), version_id: z.string().regex(RESEARCH_ID), split_id: z.string().regex(RESEARCH_ID).nullable() }),
  evaluator: z.string().regex(SLUG).default("frontier-engineering"),
  model: z.strictObject({
    model_id: z.string().regex(RESEARCH_ID),
    config: z
      .strictObject({
        reasoning_effort: z.string().nullable().default(null),
        temperature: nonNeg.nullable().default(null),
        max_context_tokens: z.number().int().positive().nullable().default(null),
        tool_mode: z.string().nullable().default(null),
        extra: z.record(z.string(), z.unknown()).default({}),
      })
      .default({ reasoning_effort: null, temperature: null, max_context_tokens: null, tool_mode: null, extra: {} }),
  }),
  agent: z
    .strictObject({
      name: z.string().min(1),
      version: z.string().nullable().default(null),
      harness_commit: z.string().nullable().default(null),
      prompt_hash: z.string().nullable().default(null),
      tools: z.array(z.string()).default([]),
      extra: z.record(z.string(), z.unknown()).default({}),
    })
    .nullable(),
  environment: z
    .strictObject({
      image: z.string().nullable().default(null),
      image_digest: z.string().nullable().default(null),
      description: z.string().nullable().default(null),
      extra: z.record(z.string(), z.unknown()).default({}),
    })
    .nullable(),
  protocol: z.strictObject({
    repetitions: z.number().int().positive(),
    grader: z.string().min(1),
    protocol_hash: z.string().nullable().default(null),
    notes: z.string().nullable().default(null),
  }),
  timestamps: z.strictObject({ started_at: isoDateTime, completed_at: isoDateTime.nullable().default(null) }),
  status: z.enum(runStatuses),
  outcomes: z
    .array(
      z.strictObject({
        metric: z.string().regex(SNAKE),
        value: z.number(),
        unit: z.string().min(1),
        normalized: z.number().nullable().default(null),
        sample_size: z.number().int().positive().nullable().default(null),
        ci: z
          .strictObject({ low: z.number(), high: z.number(), level: z.number().gt(0).lt(1), method: z.string().min(1) })
          .nullable()
          .default(null),
      }),
    )
    .default([]),
  /** Measured usage. Omit what wasn't recorded: absent is unknown, not zero. */
  usage: z
    .strictObject({
      attempts_planned: z.number().int().nonnegative().optional(),
      attempts_completed: z.number().int().nonnegative().optional(),
      tool_calls: z.number().int().nonnegative().optional(),
      retries: z.number().int().nonnegative().optional(),
      duration_seconds: nonNeg.optional(),
      api_cost_usd: nonNeg.optional(),
      infra_cost_usd: nonNeg.optional(),
      cost_coverage: z.number().min(0).max(1).optional(),
      tokens: z.partialRecord(z.enum(tokenCategories), z.number().int().nonnegative()).default({}),
    })
    .default({ tokens: {} }),
  artifacts: z
    .array(z.strictObject({ kind: z.enum(artifactKinds), url: z.string().regex(/^(https?|s3):\/\//), sha256, bytes: z.number().int().nonnegative().optional() }))
    .min(1, "a Frontier run must link at least one artifact (logs, config or results)"),
});
export type RunImportV1 = z.infer<typeof RunImportV1>;

/* ---------- hashing ---------- */

/** Canonical JSON: object keys sorted at every depth, so equal content hashes equally. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : v,
  );
}

export const sha256Of = (value: unknown) => createHash("sha256").update(canonicalJson(value)).digest("hex");
