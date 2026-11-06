/**
 * Reads research/ from disk, validates every file against the contract, and checks
 * cross-file references and publication rules. Returns every problem at once, each with
 * the file it came from, so one run of `registry:validate` shows the whole picture.
 */
import { readdir, readFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import {
  BenchmarkFile,
  CapabilitiesFile,
  LicensesFile,
  MetricsFile,
  ModelsFile,
  OrganizationsFile,
  RunImportV1,
  SourcesFile,
  type Evidence,
} from "./contract.ts";

export type Bundle = {
  organizations: z.infer<typeof OrganizationsFile>;
  capabilities: z.infer<typeof CapabilitiesFile>;
  licenses: z.infer<typeof LicensesFile>;
  metrics: z.infer<typeof MetricsFile>;
  models: z.infer<typeof ModelsFile>;
  sources: z.infer<typeof SourcesFile>;
  benchmarks: BenchmarkFile[];
  runs: RunImportV1[];
};

export class ValidationError extends Error {
  problems: string[];
  constructor(problems: string[]) {
    super(`${problems.length} problem(s) in research files:\n${problems.map((p) => `  • ${p}`).join("\n")}`);
    this.problems = problems;
  }
}

async function listFiles(dir: string, ext: string): Promise<string[]> {
  try {
    return (await readdir(dir)).filter((f) => f.endsWith(ext) && !f.startsWith("_")).sort().map((f) => join(dir, f));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

export async function loadResearch(root: string): Promise<Bundle> {
  const problems: string[] = [];
  const rel = (p: string) => relative(process.cwd(), p);

  async function read<T extends z.ZodType>(path: string, schema: T, kind: "yaml" | "json"): Promise<z.infer<T> | undefined> {
    let raw: unknown;
    try {
      const text = await readFile(path, "utf8");
      raw = kind === "yaml" ? parseYaml(text) : JSON.parse(text);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") {
        problems.push(`${rel(path)}: file is missing`);
      } else {
        problems.push(`${rel(path)}: could not parse — ${(e as Error).message}`);
      }
      return undefined;
    }
    const result = schema.safeParse(raw ?? []);
    if (!result.success) {
      for (const issue of result.error.issues) {
        problems.push(`${rel(path)}: ${issue.path.join(".") || "(root)"} — ${issue.message}`);
      }
      return undefined;
    }
    return result.data;
  }

  const [organizations, capabilities, licenses, metrics, models, sources] = await Promise.all([
    read(join(root, "organizations.yaml"), OrganizationsFile, "yaml"),
    read(join(root, "capabilities.yaml"), CapabilitiesFile, "yaml"),
    read(join(root, "licenses.yaml"), LicensesFile, "yaml"),
    read(join(root, "metrics.yaml"), MetricsFile, "yaml"),
    read(join(root, "models.yaml"), ModelsFile, "yaml"),
    read(join(root, "sources.yaml"), SourcesFile, "yaml"),
  ]);

  const benchmarkPaths = await listFiles(join(root, "benchmarks"), ".yaml");
  const benchmarks: { path: string; data: BenchmarkFile }[] = [];
  for (const path of benchmarkPaths) {
    const data = await read(path, BenchmarkFile, "yaml");
    if (!data) continue;
    if (basename(path, ".yaml") !== data.slug) problems.push(`${rel(path)}: file name must match slug "${data.slug}"`);
    benchmarks.push({ path, data });
  }

  const runPaths = await listFiles(join(root, "runs"), ".json");
  const runs: { path: string; data: RunImportV1 }[] = [];
  for (const path of runPaths) {
    const data = await read(path, RunImportV1, "json");
    if (data) runs.push({ path, data });
  }

  // Stop before cross-references if a reference file itself failed to parse.
  if (!organizations || !capabilities || !licenses || !metrics || !models || !sources) throw new ValidationError(problems);

  /* ---------- uniqueness ---------- */

  const dupes = (path: string, what: string, values: string[]) => {
    const seen = new Set<string>();
    for (const v of values) {
      const k = v.toLowerCase();
      if (seen.has(k)) problems.push(`${path}: duplicate ${what} "${v}"`);
      seen.add(k);
    }
  };
  dupes("research/organizations.yaml", "slug", organizations.map((o) => o.slug));
  dupes("research/capabilities.yaml", "slug", capabilities.map((c) => c.slug));
  dupes("research/licenses.yaml", "slug", licenses.map((l) => l.slug));
  dupes("research/metrics.yaml", "id", metrics.map((m) => m.id));
  dupes("research/models.yaml", "slug", models.map((m) => m.slug));
  dupes("research/sources.yaml", "key", sources.map((s) => s.key));
  dupes("research/sources.yaml", "url", sources.map((s) => s.url));
  dupes("research/benchmarks", "slug", benchmarks.map((b) => b.data.slug));
  dupes("research/benchmarks", "alias or name", benchmarks.flatMap((b) => [b.data.name, ...b.data.aliases]));
  dupes("research/runs", "experiment_id", runs.map((r) => r.data.experiment_id));

  /* ---------- reference checks ---------- */

  const orgs = new Set(organizations.map((o) => o.slug));
  const caps = new Set(capabilities.map((c) => c.slug));
  const lics = new Set(licenses.map((l) => l.slug));
  const modelSet = new Set(models.map((m) => m.slug));
  const sourceByKey = new Map(sources.map((s) => [s.key, s]));
  const familySlugs = new Set(benchmarks.map((b) => b.data.slug));
  const metricById = new Map(metrics.map((m) => [m.id, m]));

  for (const c of capabilities) {
    if (c.parent && !caps.has(c.parent)) problems.push(`research/capabilities.yaml: ${c.slug} has unknown parent "${c.parent}"`);
  }
  for (const m of models) {
    if (!orgs.has(m.provider)) problems.push(`research/models.yaml: ${m.slug} has unknown provider "${m.provider}"`);
  }
  for (const s of sources) {
    if (s.publisher && !orgs.has(s.publisher)) problems.push(`research/sources.yaml: ${s.key} has unknown publisher "${s.publisher}"`);
    dupes(`research/sources.yaml: ${s.key}`, "snapshot", s.snapshots.map((x) => new Date(x.retrieved_at).toISOString()));
  }

  const checkEvidence = (where: string, evidence: Evidence[], mustSupport: boolean) => {
    for (const e of evidence) {
      const src = sourceByKey.get(e.source);
      if (!src) {
        problems.push(`${where}: unknown source "${e.source}" (add it to research/sources.yaml)`);
        continue;
      }
      if (e.retrieved_at && !src.snapshots.some((s) => Date.parse(s.retrieved_at) === Date.parse(e.retrieved_at!))) {
        problems.push(`${where}: source "${e.source}" has no snapshot retrieved at ${e.retrieved_at}`);
      }
    }
    if (mustSupport && !evidence.some((e) => e.role === "supports")) {
      problems.push(`${where}: published, so it needs at least one supporting evidence entry`);
    }
  };

  for (const { path, data: b } of benchmarks) {
    const at = rel(path);
    const published = b.review_state === "published";

    if (published) {
      if (b.kind === "unclassified") problems.push(`${at}: published entries must have a kind other than "unclassified"`);
      if (!b.summary) problems.push(`${at}: published entries need a summary`);
      if (!b.reviewed_on) problems.push(`${at}: published entries need reviewed_on`);
      if (!b.last_verified_on) problems.push(`${at}: published entries need last_verified_on`);
    }

    if (b.maintainer) {
      if (!orgs.has(b.maintainer.value)) problems.push(`${at}: maintainer "${b.maintainer.value}" is not in organizations.yaml`);
      checkEvidence(`${at}: maintainer`, b.maintainer.evidence, published);
    }
    for (const c of b.capabilities) if (!caps.has(c)) problems.push(`${at}: unknown capability "${c}"`);
    dupes(at, "capability", b.capabilities);
    for (const r of b.relationships) {
      if (!familySlugs.has(r.target)) problems.push(`${at}: relationship target "${r.target}" has no benchmark file`);
      if (r.target === b.slug) problems.push(`${at}: a benchmark cannot relate to itself`);
    }

    const labels = new Set(b.versions.map((v) => v.label));
    dupes(at, "version label", b.versions.map((v) => v.label));
    if (b.versions.filter((v) => v.default).length > 1) problems.push(`${at}: only one version can be the default`);
    for (const v of b.versions) {
      if (v.released_on) checkEvidence(`${at}: version ${v.label} released_on`, v.released_on.evidence, published);
      dupes(`${at}: version ${v.label}`, "split", v.splits.map((s) => s.name));
      for (const s of v.splits) {
        if (s.task_count) checkEvidence(`${at}: split ${v.label}/${s.name} task_count`, s.task_count.evidence, published);
      }
    }
    const splitKeys = new Set(b.versions.flatMap((v) => v.splits.map((s) => `${v.label}/${s.name}`)));

    for (const r of b.resources) {
      if (r.license && !lics.has(r.license)) problems.push(`${at}: resource ${r.url} has unknown license "${r.license}"`);
      if (r.version && !labels.has(r.version)) problems.push(`${at}: resource ${r.url} names unknown version "${r.version}"`);
    }

    dupes(at, "claim id", b.claims.map((c) => c.id));
    for (const c of b.claims) {
      const where = `${at}: claim ${c.id}`;
      if (c.subject.startsWith("version:")) {
        if (!labels.has(c.subject.slice(8))) problems.push(`${where}: unknown version in subject "${c.subject}"`);
      } else if (c.subject.startsWith("split:")) {
        if (!splitKeys.has(c.subject.slice(6))) problems.push(`${where}: unknown split in subject "${c.subject}"`);
      } else if (c.subject !== "family") {
        problems.push(`${where}: subject must be "family", "version:<label>" or "split:<label>/<name>"`);
      }
      if (["maintainer", "released_on", "task_count"].includes(c.field)) {
        problems.push(`${where}: "${c.field}" is a structured field; set it on the benchmark, version or split instead`);
      }
      checkEvidence(where, c.evidence, published);
    }

    dupes(at, "citation id", b.citations.map((c) => c.id));
    for (const c of b.citations) {
      const where = `${at}: citation ${c.id}`;
      if (!orgs.has(c.org)) problems.push(`${where}: unknown organization "${c.org}"`);
      if (c.model && !modelSet.has(c.model)) problems.push(`${where}: unknown model "${c.model}" (add it to models.yaml)`);
      if (c.version && !labels.has(c.version)) problems.push(`${where}: unknown version "${c.version}"`);
      checkEvidence(where, c.evidence, published);
    }
    // The database deduplicates citations of one experiment; catch it here with a clearer message.
    dupes(
      at,
      "citation (same org, model, version, kind and date)",
      b.citations.map((c) => [c.org, c.model ?? "-", c.version ?? "-", c.kind, c.cited_on].join(" | ")),
    );

    dupes(at, "audit id", b.audits.map((a) => a.id));
    for (const a of b.audits) {
      const where = `${at}: audit ${a.id}`;
      if (a.version && !labels.has(a.version)) problems.push(`${where}: unknown version "${a.version}"`);
      checkEvidence(where, a.evidence, published);
    }
  }

  const familyBySlug = new Map(benchmarks.map((b) => [b.data.slug, b.data]));
  for (const { path, data: r } of runs) {
    const at = rel(path);
    const fam = familyBySlug.get(r.benchmark.family);
    const ver = fam?.versions.find((v) => v.label === r.benchmark.version);
    if (!fam) problems.push(`${at}: unknown benchmark family "${r.benchmark.family}"`);
    else if (!ver) problems.push(`${at}: ${r.benchmark.family} has no version "${r.benchmark.version}"`);
    else if (r.benchmark.split !== null && !ver.splits.some((s) => s.name === r.benchmark.split)) {
      problems.push(`${at}: ${r.benchmark.family}@${r.benchmark.version} has no split "${r.benchmark.split}"`);
    }
    if (!modelSet.has(r.model.slug)) problems.push(`${at}: unknown model "${r.model.slug}"`);
    if (!orgs.has(r.evaluator)) problems.push(`${at}: unknown evaluator "${r.evaluator}"`);
    for (const o of r.outcomes) {
      const m = metricById.get(o.metric);
      if (!m) problems.push(`${at}: unknown metric "${o.metric}"`);
      else if (m.scope !== "evaluation") problems.push(`${at}: metric "${o.metric}" is not an evaluation metric`);
    }
    dupes(at, "outcome metric", r.outcomes.map((o) => o.metric));
    if (r.status !== "completed" && r.outcomes.length > 0 && r.status !== "incomplete") {
      problems.push(`${at}: only completed or incomplete runs can carry outcomes`);
    }
  }

  if (problems.length) throw new ValidationError(problems);

  return {
    organizations,
    capabilities,
    licenses,
    metrics,
    models,
    sources,
    benchmarks: benchmarks.map((b) => b.data),
    runs: runs.map((r) => r.data),
  };
}
