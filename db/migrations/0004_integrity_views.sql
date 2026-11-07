-- Benchmark Intelligence Directory — integrity and reporting views.

-- Structured fact columns are a cache of published claims. This view lists every value on a
-- published benchmark that is NOT backed by a matching published claim. It must stay empty.
create view benchmarks.unsupported_facts with (security_invoker = true) as
  select 'benchmark_families' as table_name, f.id as row_id, f.slug as label, 'maintainer' as field
  from benchmarks.benchmark_families f
  join benchmarks.organizations o on o.id = f.maintainer_id
  where f.review_state = 'published'
    and not exists (
      select 1 from benchmarks.claims c
      where c.subject_id = f.id and c.field = 'maintainer' and c.review_state = 'published'
        and c.value_text = o.slug
    )
  union all
  select 'benchmark_versions', v.id, f.slug || '@' || v.label, 'released_on'
  from benchmarks.benchmark_versions v
  join benchmarks.benchmark_families f on f.id = v.family_id
  where f.review_state = 'published' and v.released_on is not null
    and not exists (
      select 1 from benchmarks.claims c
      where c.subject_id = v.id and c.field = 'released_on' and c.review_state = 'published'
        and c.value_date = v.released_on and c.value_date_precision = v.released_precision
    )
  union all
  select 'benchmark_splits', s.id, f.slug || '@' || v.label || '/' || s.name, 'task_count'
  from benchmarks.benchmark_splits s
  join benchmarks.benchmark_versions v on v.id = s.version_id
  join benchmarks.benchmark_families f on f.id = v.family_id
  where f.review_state = 'published' and s.task_count is not null
    and not exists (
      select 1 from benchmarks.claims c
      where c.subject_id = s.id and c.field = 'task_count' and c.review_state = 'published'
        and c.value_numeric = s.task_count
    );

-- Observable adoption, labelled the way the plan asks: unique citing organizations and known
-- published citations per family, counting only published claims and never fixtures.
create view benchmarks.family_adoption with (security_invoker = true) as
  select
    f.id as family_id,
    f.slug,
    count(distinct bc.citing_org_id) as unique_citing_organizations,
    count(bc.id) as known_published_citations,
    count(bc.id) filter (where bc.kind = 'score_report') as known_score_reports,
    min(bc.cited_on) as first_cited_on,
    max(bc.cited_on) as last_cited_on
  from benchmarks.benchmark_families f
  left join benchmarks.benchmark_citations bc on bc.family_id = f.id
    and exists (select 1 from benchmarks.claims c where c.id = bc.claim_id and c.review_state = 'published')
  group by f.id, f.slug;
