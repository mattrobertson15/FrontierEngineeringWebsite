/**
 * Benchmark Intelligence Directory: the shapes the pages render, and the labels for them.
 * Safe to import from client components. The database reader lives in ./data.ts.
 *
 * Unknown is `null`, never zero. Pages must show missing data as missing.
 */

export const tracks = {
  coding: "Coding",
  agents: "Agents & tool use",
  enterprise: "Enterprise work",
  reliability: "Reliability",
} as const;
export type Track = keyof typeof tracks;

/** `benchmark_kind` values worth naming in a tag. Plain "benchmark" needs no tag. */
export const kindLabels: Record<string, string> = {
  variant: "Variant",
  suite: "Suite",
  framework: "Framework",
  evaluation_study: "Evaluation study",
  index: "Index",
  benchmark_family: "Benchmark family",
  evaluation_environment: "Evaluation environment",
  benchmark_and_agent: "Benchmark and agent",
  benchmark_and_platform: "Benchmark and platform",
};

export const maintenanceLabels: Record<string, string> = {
  active: "Actively maintained",
  unmaintained: "No longer maintained",
  superseded: "Superseded",
  deprecated: "Deprecated",
};

export const verificationLabels = {
  verified: "Verified",
  reported: "Reported",
  estimated: "Estimated",
  unverified: "Unverified",
} as const;
export type Verification = keyof typeof verificationLabels;

export const relationshipLabels: Record<string, { out: string; in: string }> = {
  variant_of: { out: "Variant of", in: "Has variant" },
  derived_from: { out: "Derived from", in: "Source for" },
  successor_of: { out: "Successor of", in: "Succeeded by" },
  subset_of: { out: "Subset of", in: "Contains" },
  related_to: { out: "Related to", in: "Related to" },
};

const factLabels: Record<string, string> = {
  scope_summary: "Scope",
  task_count: "Tasks",
  released_on: "Released",
  overall_aggregation: "Overall score",
  repository_license_label: "Repository licence",
  gpu_requirement: "GPU requirement",
};

const gapLabels: Record<string, string> = {
  economics: "Running costs",
  taxonomy: "Classification",
  freshness: "Data freshness",
  adoption: "Lab adoption",
  version_pin: "Exact version",
  task_manifest: "Task list",
};

const humanize = (s: string) => {
  const t = s.replaceAll("_", " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
};
export const factLabel = (field: string) => factLabels[field] ?? humanize(field);
export const gapLabel = (type: string) => gapLabels[type] ?? humanize(type);

/* ---------- shapes ---------- */

export type Capability = { slug: string; name: string; axis: "capability" | "domain"; primary: boolean };

export type Source = {
  key: string;
  title: string;
  url: string;
  publisher: string | null;
  /** Date the source was read, YYYY-MM-DD. Not its publication date. */
  retrievedOn: string | null;
  provenance: "primary" | "independent_audit" | "secondary" | null;
};

export type MetricReading = {
  metric: string;
  name: string;
  value: number;
  /** As shown on the source, e.g. "1.9k". */
  display: string;
  rounded: boolean;
  observedOn: string;
};

export type DirectoryEntry = {
  slug: string;
  name: string;
  kind: string;
  track: Track | null;
  summary: string;
  capabilities: Capability[];
  maintenance: string | null;
  githubStars: MetricReading | null;
  auditCount: number;
  factCount: number;
  checkedOn: string | null;
  reviewedOn: string | null;
};

export type Evidence = {
  role: "supports" | "disputes" | "context";
  locator: string | null;
  excerpt: string | null;
  source: Source;
};

export type Fact = {
  field: string;
  value: string;
  status: Verification;
  /** Version label when the fact is about one version, not the whole benchmark. */
  version: string | null;
  evidence: Evidence[];
};

export type Version = {
  label: string;
  releasedOn: string | null;
  taskCount: number | null;
  isDefault: boolean;
  pinned: boolean;
};

export type Audit = {
  auditor: string;
  date: string | null;
  verdict: string | null;
  version: string | null;
  summary: string | null;
  affectedTasks: number | null;
  reviewedTasks: number | null;
  remediation: string;
};

export type Relationship = {
  label: string;
  slug: string;
  name: string;
  /** Only published entries have a page to link to. */
  published: boolean;
};

export type Profile = DirectoryEntry & {
  aliases: string[];
  relationships: Relationship[];
  facts: Fact[];
  versions: Version[];
  signals: MetricReading[];
  audits: Audit[];
  openGaps: { priority: string; label: string }[];
  primarySource: Source | null;
  sources: Source[];
};

/* ---------- formatting ---------- */

export const formatDate = (iso: string | null) =>
  iso
    ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;
