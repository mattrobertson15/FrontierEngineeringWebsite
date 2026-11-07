import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "./db";
import {
  formatDate,
  relationshipLabels,
  gapLabel,
  type Audit,
  type DirectoryEntry,
  type Evidence,
  type Fact,
  type MetricReading,
  type Profile,
  type Relationship,
  type Source,
  type Version,
} from "./types";

/**
 * Queries behind /benchmarks. Only `review_state = 'published'` rows ever leave this file:
 * the site role can read drafts, so every query filters on it.
 *
 * Data changes only when `registry:import` runs, so results are cached for hours.
 * Dates come back as YYYY-MM-DD text and numbers as JS numbers, so results serialize cleanly.
 */

const TAG = "benchmarks";

function cached() {
  cacheLife("hours");
  cacheTag(TAG);
}

/* ---------- row → shape ---------- */

type SourceRow = {
  key: string;
  title: string | null;
  url: string;
  publisher: string | null;
  retrieved_on: string | null;
  provenance: Source["provenance"];
};
const toSource = (s: SourceRow): Source => ({
  key: s.key,
  title: s.title ?? s.url,
  url: s.url,
  publisher: s.publisher,
  retrievedOn: s.retrieved_on,
  provenance: s.provenance,
});

type MetricRow = {
  metric_id: string;
  name: string;
  value: number;
  value_display: string | null;
  precision: string | null;
  observed_on: string;
};
const toMetric = (m: MetricRow): MetricReading => ({
  metric: m.metric_id,
  name: m.name,
  value: m.value,
  display: m.value_display ?? new Intl.NumberFormat("en").format(m.value),
  rounded: m.precision === "rounded" || m.precision === "rounded_display",
  observedOn: m.observed_on,
});

/** Shared directory columns, for one family `f`. */
const directoryColumns = () => db()`
  f.id, f.slug, f.name, f.kind::text as kind, f.editorial_track::text as track, f.summary,
  nullif(f.status::text, 'unknown') as maintenance,
  to_char(f.checked_on, 'YYYY-MM-DD') as checked_on,
  to_char(f.reviewed_at, 'YYYY-MM-DD') as reviewed_on,
  coalesce((
    select json_agg(json_build_object('slug', c.slug, 'name', c.name, 'axis', c.axis, 'primary', bc.is_primary)
                    order by bc.is_primary desc, c.axis, c.name)
    from benchmarks.benchmark_capabilities bc join benchmarks.capabilities c on c.slug = bc.capability_slug
    where bc.family_id = f.id
  ), '[]'::json) as capabilities,
  (select count(*)::int from benchmarks.benchmark_audits a
     join benchmarks.claims ac on ac.id = a.claim_id and ac.review_state = 'published'
   where a.family_id = f.id) as audit_count,
  (select count(*)::int from benchmarks.claims c
   where c.review_state = 'published' and c.field not in ('relationship', 'audit_verdict')
     and (c.subject_id = f.id or c.subject_id in (select v.id from benchmarks.benchmark_versions v where v.family_id = f.id))
  ) as fact_count,
  (select json_build_object('metric_id', m.metric_id, 'name', d.name, 'value', m.value::float8,
            'value_display', m.value_display, 'precision', m.precision, 'observed_on', to_char(m.observed_on, 'YYYY-MM-DD'))
   from benchmarks.metric_snapshots m join benchmarks.metric_definitions d on d.id = m.metric_id
   where m.subject_id = f.id and m.metric_id = 'github_stars'
   order by m.observed_on desc nulls last, m.id desc limit 1
  ) as github_stars
`;

type DirectoryRow = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  track: DirectoryEntry["track"];
  summary: string;
  maintenance: string | null;
  checked_on: string | null;
  reviewed_on: string | null;
  capabilities: DirectoryEntry["capabilities"];
  audit_count: number;
  fact_count: number;
  github_stars: MetricRow | null;
};
const toEntry = (r: DirectoryRow): DirectoryEntry => ({
  slug: r.slug,
  name: r.name,
  kind: r.kind,
  track: r.track,
  summary: r.summary,
  capabilities: r.capabilities,
  maintenance: r.maintenance,
  githubStars: r.github_stars ? toMetric(r.github_stars) : null,
  auditCount: r.audit_count,
  factCount: r.fact_count,
  checkedOn: r.checked_on,
  reviewedOn: r.reviewed_on,
});

/* ---------- queries ---------- */

/** Every published registry entry, A–Z. */
export async function getDirectory(): Promise<DirectoryEntry[]> {
  "use cache";
  cached();
  const sql = db();
  const rows = await sql<DirectoryRow[]>`
    select ${directoryColumns()} from benchmarks.benchmark_families f
    where f.review_state = 'published'
    order by lower(f.name)
  `;
  return rows.map(toEntry);
}

/** Slugs of published entries, for generateStaticParams and the sitemap. */
export async function getPublishedSlugs(): Promise<string[]> {
  "use cache";
  cached();
  const rows = await db()<{ slug: string }[]>`
    select slug from benchmarks.benchmark_families where review_state = 'published' order by slug
  `;
  return rows.map((r) => r.slug);
}

/** Facts first, then the benchmark's other published facts, then version-specific ones. */
const factOrder = ["scope_summary", "task_count", "released_on"];

/** The full profile of one published entry, or null if it is missing or unpublished. */
export async function getProfile(slug: string): Promise<Profile | null> {
  "use cache";
  cached();
  const sql = db();

  const [family] = await sql<(DirectoryRow & { primary_source_id: string | null })[]>`
    select ${directoryColumns()}, f.primary_source_id from benchmarks.benchmark_families f
    where f.slug = ${slug} and f.review_state = 'published'
  `;
  if (!family) return null;
  const id = family.id;

  const sourceColumns = sql`
    s.key, s.title, s.canonical_url as url, coalesce(po.name, s.publisher_name) as publisher,
    s.provenance::text as provenance
  `;

  const [aliases, relationships, facts, versions, signals, audits, gaps, primary] = await Promise.all([
    sql<{ alias: string }[]>`
      select alias from benchmarks.benchmark_aliases where family_id = ${id} order by lower(alias)
    `,
    sql<{ kind: string; dir: "out" | "in"; slug: string; name: string; published: boolean }[]>`
      select r.kind::text as kind, 'out' as dir, o.slug, o.name, o.review_state = 'published' as published
      from benchmarks.benchmark_relationships r
      join benchmarks.claims rc on rc.id = r.claim_id and rc.review_state = 'published'
      join benchmarks.benchmark_families o on o.id = r.object_family_id
      where r.subject_family_id = ${id}
      union all
      select r.kind::text, 'in', s.slug, s.name, s.review_state = 'published'
      from benchmarks.benchmark_relationships r
      join benchmarks.claims rc on rc.id = r.claim_id and rc.review_state = 'published'
      join benchmarks.benchmark_families s on s.id = r.subject_family_id
      where r.object_family_id = ${id}
      order by 2, 1, 4
    `,
    sql<{
      field: string;
      value_text: string | null;
      value_numeric: number | null;
      value_date: string | null;
      unit: string | null;
      status: Fact["status"];
      version: string | null;
      evidence: (Omit<Evidence, "source"> & { source: SourceRow })[];
    }[]>`
      select c.field, c.value_text, c.value_numeric::float8 as value_numeric,
             to_char(c.value_date, 'YYYY-MM-DD') as value_date, c.unit, c.status::text as status,
             v.label as version,
             coalesce(json_agg(json_build_object(
               'role', ce.role, 'locator', ce.locator, 'excerpt', ce.excerpt,
               'source', json_build_object(
                 'key', s.key, 'title', s.title, 'url', s.canonical_url,
                 'publisher', coalesce(po.name, s.publisher_name), 'provenance', s.provenance,
                 'retrieved_on', to_char(ss.retrieved_on, 'YYYY-MM-DD'))
             ) order by ce.role, ce.id) filter (where ce.id is not null), '[]'::json) as evidence
      from benchmarks.claims c
      left join benchmarks.benchmark_versions v on v.id = c.subject_id
      left join benchmarks.claim_evidence ce on ce.claim_id = c.id
      left join benchmarks.source_snapshots ss on ss.id = ce.snapshot_id
      left join benchmarks.sources s on s.id = ss.source_id
      left join benchmarks.organizations po on po.id = s.publisher_id
      where c.review_state = 'published'
        and c.field not in ('relationship', 'audit_verdict')
        and (c.subject_id = ${id} or v.family_id = ${id})
      group by c.id, v.label
      order by v.label nulls first, c.field
    `,
    sql<{ label: string; released_on: string | null; task_count: number | null; is_default: boolean; pinned: boolean }[]>`
      select label, to_char(released_on, 'YYYY-MM-DD') as released_on, task_count, is_default,
             pin_status = 'pinned' as pinned
      from benchmarks.benchmark_versions where family_id = ${id}
      order by is_default desc, released_on desc nulls last, label desc
    `,
    sql<MetricRow[]>`
      select distinct on (m.metric_id) m.metric_id, d.name, m.value::float8 as value, m.value_display,
             m.precision::text as precision, to_char(m.observed_on, 'YYYY-MM-DD') as observed_on
      from benchmarks.metric_snapshots m join benchmarks.metric_definitions d on d.id = m.metric_id
      where m.subject_id = ${id} and m.value is not null and m.observed_on is not null
      order by m.metric_id, m.observed_on desc, m.id desc
    `,
    sql<{
      auditor: string;
      date: string | null;
      verdict: string | null;
      version: string | null;
      summary: string | null;
      affected: number | null;
      reviewed: number | null;
      remediation: string;
    }[]>`
      select coalesce(ao.name, a.auditor_name) as auditor, to_char(a.audit_date, 'YYYY-MM-DD') as date,
             a.verdict, v.label as version, a.summary, a.affected_tasks_lower_bound as affected,
             a.review_task_count as reviewed, a.remediation_status::text as remediation
      from benchmarks.benchmark_audits a
      join benchmarks.claims ac on ac.id = a.claim_id and ac.review_state = 'published'
      left join benchmarks.organizations ao on ao.id = a.auditor_id
      left join benchmarks.benchmark_versions v on v.id = a.version_id
      where a.family_id = ${id}
      order by a.audit_date desc nulls last
    `,
    sql<{ priority: string; gap_type: string }[]>`
      select priority::text as priority, gap_type from benchmarks.research_gaps
      where family_id = ${id} and status in ('open', 'in_progress')
      order by priority, gap_type
    `,
    family.primary_source_id
      ? sql<SourceRow[]>`
          select ${sourceColumns},
                 (select to_char(max(ss.retrieved_on), 'YYYY-MM-DD') from benchmarks.source_snapshots ss
                  where ss.source_id = s.id) as retrieved_on
          from benchmarks.sources s left join benchmarks.organizations po on po.id = s.publisher_id
          where s.id = ${family.primary_source_id}
        `
      : Promise.resolve([] as SourceRow[]),
  ]);

  const factList: Fact[] = facts
    .map((c) => ({
      field: c.field,
      value: factValue(c),
      status: c.status,
      version: c.version,
      evidence: c.evidence.map((e) => ({ ...e, source: toSource(e.source) })),
    }))
    .sort((a, b) => {
      if ((a.version === null) !== (b.version === null)) return a.version === null ? -1 : 1;
      const rank = (f: string) => (factOrder.includes(f) ? factOrder.indexOf(f) : factOrder.length);
      return rank(a.field) - rank(b.field) || a.field.localeCompare(b.field);
    });

  const primarySource = primary[0] ? toSource(primary[0]) : null;
  const sources = new Map<string, Source>();
  if (primarySource) sources.set(primarySource.key, primarySource);
  for (const f of factList) for (const e of f.evidence) if (!sources.has(e.source.key)) sources.set(e.source.key, e.source);

  return {
    ...toEntry(family),
    aliases: aliases.map((a) => a.alias),
    relationships: relationships.map(
      (r): Relationship => ({
        label: relationshipLabels[r.kind]?.[r.dir] ?? r.kind,
        slug: r.slug,
        name: r.name,
        published: r.published,
      }),
    ),
    facts: factList,
    versions: versions.map(
      (v): Version => ({
        label: v.label,
        releasedOn: v.released_on,
        taskCount: v.task_count,
        isDefault: v.is_default,
        pinned: v.pinned,
      }),
    ),
    signals: signals.map(toMetric),
    audits: audits.map(
      (a): Audit => ({
        auditor: a.auditor,
        date: a.date,
        verdict: a.verdict,
        version: a.version,
        summary: a.summary,
        affectedTasks: a.affected,
        reviewedTasks: a.reviewed,
        remediation: a.remediation,
      }),
    ),
    openGaps: gaps.map((g) => ({ priority: g.priority, label: gapLabel(g.gap_type) })),
    primarySource,
    sources: [...sources.values()],
  };
}

function factValue(c: { value_text: string | null; value_numeric: number | null; value_date: string | null; unit: string | null }) {
  if (c.value_numeric !== null) {
    const n = new Intl.NumberFormat("en").format(c.value_numeric);
    return c.unit ? `${n} ${c.unit}` : n;
  }
  if (c.value_date !== null) return formatDate(c.value_date) ?? c.value_date;
  return c.value_text ?? "";
}
