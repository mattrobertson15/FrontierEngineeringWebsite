/**
 * Import contract for the Benchmark Intelligence Directory.
 *
 * Two inputs share this file:
 *   1. Curated research (research/*.yaml, research/benchmarks/<slug>.yaml) — reviewed in git.
 *   2. Frontier evaluation runs (research/runs/<experiment>.json) — contract "frontier-run/v1".
 *
 * Enum lists mirror the Postgres enums in db/migrations; a test fails if they drift.
 */
import { createHash } from "node:crypto";
import { z } from "zod";

/* ---------- enums (must match the database) ---------- */

export const organizationTypes = ["lab", "academic", "company", "nonprofit", "independent", "government"] as const;
export const benchmarkKinds = ["benchmark", "suite", "framework", "evaluation_study", "index", "unclassified"] as const;
export const maintenanceStatuses = ["active", "unmaintained", "superseded", "deprecated", "unknown"] as const;
export const profileDepths = ["registry", "detailed"] as const;
export const researchPriorities = ["high", "medium", "low"] as const;
export const reviewStates = ["draft", "in_review", "published", "retracted"] as const;
export const splitVisibilities = ["public", "semi_private", "private", "unknown"] as const;
export const capabilityAxes = ["capability", "domain"] as const;
export const relationshipKinds = ["variant_of", "derived_from", "successor_of", "subset_of", "related_to"] as const;
export const resourceKinds = ["paper", "repository", "dataset", "harness", "website", "leaderboard", "documentation"] as const;
export const licenseCategories = ["permissive", "copyleft", "non_commercial", "proprietary", "custom", "unknown"] as const;
export const verificationStatuses = ["verified", "reported", "estimated", "unverified"] as const;
export const evidenceRoles = ["supports", "disputes", "context"] as const;
export const sourceKinds = [
  "paper", "model_card", "system_card", "blog_post", "leaderboard", "repository",
  "dataset_card", "documentation", "news", "other",
] as const;
export const citationKinds = ["mention", "explicit_adoption", "score_report", "reproduction", "audit", "frontier_run"] as const;
export const metricScopes = ["evaluation", "engagement"] as const;
export const metricDirections = ["higher_is_better", "lower_is_better", "neutral"] as const;
export const auditSeverities = ["low", "medium", "high", "critical"] as const;
export const auditResolutions = ["open", "acknowledged", "resolved", "wont_fix", "disputed"] as const;
export const runStatuses = ["planned", "running", "completed", "incomplete", "failed", "cancelled"] as const;
export const tokenCategories = ["input", "cache_read", "cache_write", "reasoning", "output"] as const;
export const artifactKinds = ["log", "config", "results", "trajectory", "other"] as const;

/** Every TS enum list keyed by its Postgres type name, for the drift test. */
export const dbEnums: Record<string, readonly string[]> = {
  organization_type: organizationTypes,
  benchmark_kind: benchmarkKinds,
  maintenance_status: maintenanceStatuses,
  profile_depth: profileDepths,
  research_priority: researchPriorities,
  review_state: reviewStates,
  split_visibility: splitVisibilities,
  capability_axis: capabilityAxes,
  relationship_kind: relationshipKinds,
  resource_kind: resourceKinds,
  license_category: licenseCategories,
  verification_status: verificationStatuses,
  evidence_role: evidenceRoles,
  source_kind: sourceKinds,
  citation_kind: citationKinds,
  metric_scope: metricScopes,
  metric_direction: metricDirections,
  audit_severity: auditSeverities,
  audit_resolution: auditResolutions,
  run_status: runStatuses,
  token_category: tokenCategories,
  artifact_kind: artifactKinds,
};

/* ---------- primitives ---------- */

export const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "use a lowercase-hyphenated slug");
/** Slugs that may also contain dots, e.g. model and source keys ("claude-opus-5.5"). */
export const key = z.string().regex(/^[a-z0-9]+([.-][a-z0-9]+)*$/, "use lowercase letters, digits, '-' and '.'");
const httpUrl = z.url({ protocol: /^https?$/ });
const sha256 = z.string().regex(/^[0-9a-f]{64}$/, "lowercase hex sha256");
/** A version label. YAML reads `1.0` as the number 1, so labels must be quoted strings. */
const label = z.string({ error: "must be a quoted string (YAML reads 1.0 as the number 1)" }).min(1);

/** "2024", "2024-08" or "2024-08-13". Never invent a day or month you don't have. */
export const partialDate = z.preprocess(
  (v) => (typeof v === "number" ? String(v) : v),
  z.string().regex(/^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/, "use YYYY, YYYY-MM or YYYY-MM-DD"),
);
const isoDate = z.iso.date();
const isoDateTime = z.iso.datetime({ offset: true });

export type Precision = "year" | "month" | "day";
export function parsePartialDate(s: string): { date: string; precision: Precision } {
  const parts = s.split("-");
  const precision: Precision = parts.length === 1 ? "year" : parts.length === 2 ? "month" : "day";
  return { date: [parts[0], parts[1] ?? "01", parts[2] ?? "01"].join("-"), precision };
}

/* ---------- evidence & facts ---------- */

export const Evidence = z.strictObject({
  /** Key of an entry in research/sources.yaml. */
  source: key,
  /** Which snapshot of the source; defaults to the most recent. */
  retrieved_at: isoDateTime.optional(),
  /** Where in the source: page, section, table, line. */
  locator: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  role: z.enum(evidenceRoles).default("supports"),
});
export type Evidence = z.infer<typeof Evidence>;

const evidenced = {
  status: z.enum(verificationStatuses),
  evidence: z.array(Evidence).default([]),
};

/** A structured value backed by evidence. `null` means unknown — never write 0 or "" instead. */
const fact = <T extends z.ZodType>(value: T) =>
  z.strictObject({ value, ...evidenced }).nullable().default(null);

/* ---------- reference files ---------- */

export const OrganizationsFile = z.array(
  z.strictObject({ slug, name: z.string().min(1), type: z.enum(organizationTypes), website: httpUrl.optional() }),
);

export const CapabilitiesFile = z.array(
  z.strictObject({
    slug,
    axis: z.enum(capabilityAxes),
    name: z.string().min(1),
    description: z.string().optional(),
    parent: slug.optional(),
  }),
);

export const LicensesFile = z.array(
  z.strictObject({
    slug: key,
    name: z.string().min(1),
    spdx_id: z.string().optional(),
    category: z.enum(licenseCategories),
    url: httpUrl.optional(),
  }),
);

export const MetricsFile = z.array(
  z.strictObject({
    id: z.string().regex(/^[a-z][a-z0-9_]*$/),
    scope: z.enum(metricScopes),
    name: z.string().min(1),
    unit: z.string().min(1),
    direction: z.enum(metricDirections),
    aggregation: z.string().optional(),
    denominator: z.string().optional(),
    description: z.string().optional(),
  }),
);

export const ModelsFile = z.array(
  z.strictObject({
    slug: key,
    name: z.string().min(1),
    provider: slug,
    open_weights: z.boolean().nullable().default(null),
  }),
);

export const SourcesFile = z.array(
  z.strictObject({
    key,
    url: httpUrl,
    title: z.string().min(1),
    kind: z.enum(sourceKinds),
    publisher: slug.optional(),
    published_on: partialDate.optional(),
    snapshots: z
      .array(
        z.strictObject({
          retrieved_at: isoDateTime,
          content_hash: sha256.optional(),
          archive_url: httpUrl.optional(),
        }),
      )
      .min(1, "record at least one retrieval (when you read it)"),
  }),
);

/* ---------- benchmark file ---------- */

export const BenchmarkFile = z.strictObject({
  slug,
  name: z.string().min(1),
  kind: z.enum(benchmarkKinds),
  /** Plain-language, editorial, no unsourced numbers. ≤ 280 characters. */
  summary: z.string().max(280).optional(),
  description: z.string().optional(),
  maintainer: fact(slug),
  status: z.enum(maintenanceStatuses).default("unknown"),
  profile_depth: z.enum(profileDepths).default("registry"),
  research_priority: z.enum(researchPriorities).default("medium"),
  review_state: z.enum(reviewStates).default("draft"),
  reviewed_on: isoDate.nullable().default(null),
  last_verified_on: isoDate.nullable().default(null),
  aliases: z.array(z.string().min(1)).default([]),
  /** Capability and domain slugs. The first is the primary capability. */
  capabilities: z.array(slug).default([]),
  relationships: z
    .array(z.strictObject({ kind: z.enum(relationshipKinds), target: slug, notes: z.string().optional() }))
    .default([]),
  resources: z
    .array(
      z.strictObject({
        kind: z.enum(resourceKinds),
        url: httpUrl,
        version: label.optional(),
        license: key.optional(),
        access: z.string().optional(),
      }),
    )
    .default([]),
  versions: z
    .array(
      z.strictObject({
        label,
        released_on: fact(partialDate),
        default: z.boolean().default(false),
        dataset_hash: z.string().optional(),
        harness_commit: z.string().optional(),
        notes: z.string().optional(),
        splits: z
          .array(
            z.strictObject({
              name: z.string().min(1),
              visibility: z.enum(splitVisibilities).default("unknown"),
              task_count: fact(z.number().int().positive()),
              notes: z.string().optional(),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
  /** Other factual assertions: human baselines, contamination findings, funding disclosures… */
  claims: z
    .array(
      z.strictObject({
        id: slug,
        field: z.string().regex(/^[a-z][a-z0-9_]*$/),
        /** "family" (default), "version:<label>" or "split:<label>/<name>". */
        subject: z.string().default("family"),
        statement: z.string().min(1),
        value: z.union([z.number(), z.string()]).optional(),
        unit: z.string().optional(),
        ...evidenced,
      }),
    )
    .default([]),
  citations: z
    .array(
      z.strictObject({
        id: slug,
        org: slug,
        kind: z.enum(citationKinds),
        model: key.optional(),
        version: label.optional(),
        cited_on: partialDate,
        ...evidenced,
      }),
    )
    .default([]),
  audits: z
    .array(
      z.strictObject({
        id: slug,
        title: z.string().min(1),
        issue: z.string().min(1),
        severity: z.enum(auditSeverities),
        version: label.optional(),
        affected_tasks: z.number().int().nonnegative().optional(),
        resolution: z.enum(auditResolutions).default("open"),
        reported_on: partialDate,
        ...evidenced,
      }),
    )
    .default([]),
});
export type BenchmarkFile = z.infer<typeof BenchmarkFile>;

/* ---------- Frontier run import contract ---------- */

const nonNeg = z.number().nonnegative();

export const RunImportV1 = z.strictObject({
  contract: z.literal("frontier-run/v1"),
  /** Stable experiment id. Re-importing the same id must carry an identical payload. */
  experiment_id: z.string().regex(/^[a-z0-9]+([._-][a-z0-9]+)*$/),
  /** True only for test fixtures. Fixtures are rejected unless the importer is told to allow them. */
  fixture: z.boolean().default(false),
  benchmark: z.strictObject({ family: slug, version: label, split: z.string().min(1).nullable() }),
  evaluator: slug.default("frontier-engineering"),
  model: z.strictObject({
    slug: key,
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
        metric: z.string().regex(/^[a-z][a-z0-9_]*$/),
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
