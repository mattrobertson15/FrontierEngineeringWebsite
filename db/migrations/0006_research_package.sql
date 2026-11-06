-- Benchmark Intelligence Directory — adopt the research package model (CSV batch 0.1).
--
-- The research CSVs in research/ are now the editorial master. This migration aligns the schema
-- with that package:
--   * every imported row keeps its stable research id (`research_id` / `key`)
--   * the package's vocabularies: entity kinds, research priority, identity and profile status
--   * source retrievals are dates, never invented times; snapshots are keyed by date and hash
--   * popularity observations carry their precision ("1.9k" is not exactly 1,900)
--   * audits are attributed findings (auditor, verdict, scope, remediation), not our severity
--   * version-level task counts, evidence-backed relationships, research gaps, and a staging
--     table for publisher result observations that are not yet comparable

-- ---------------------------------------------------------------- vocabularies

alter type benchmarks.benchmark_kind add value if not exists 'variant';
alter type benchmarks.benchmark_kind add value if not exists 'benchmark_family';
alter type benchmarks.benchmark_kind add value if not exists 'evaluation_environment';
alter type benchmarks.benchmark_kind add value if not exists 'benchmark_and_agent';
alter type benchmarks.benchmark_kind add value if not exists 'benchmark_and_platform';

create type benchmarks.editorial_track as enum ('coding', 'agents', 'enterprise', 'reliability');
create type benchmarks.identity_status as enum ('not_checked', 'primary_source_located');
create type benchmarks.profile_status as enum ('registry_only', 'pilot_draft', 'profile_draft', 'profile_complete');
create type benchmarks.pin_status as enum ('label_only', 'source_short_commit', 'pinned');
create type benchmarks.source_provenance as enum ('primary', 'independent_audit', 'secondary');
create type benchmarks.capture_kind as enum ('paraphrase', 'quotation');
create type benchmarks.value_precision as enum ('exact', 'rounded', 'displayed_integer', 'rounded_display');
create type benchmarks.remediation_status as enum ('not_checked', 'open', 'acknowledged', 'resolved', 'wont_fix', 'disputed');
create type benchmarks.gap_priority as enum ('P0', 'P1', 'P2');
create type benchmarks.gap_status as enum ('open', 'in_progress', 'resolved', 'wont_fix');
create type benchmarks.comparison_status as enum ('not_ready', 'ready', 'excluded');

-- research_priority: high/medium/low  ->  pilot/launch/expand/supporting/backlog
create type benchmarks.research_priority_v2 as enum ('pilot', 'launch', 'expand', 'supporting', 'backlog');
alter table benchmarks.benchmark_families alter column research_priority drop default;
alter table benchmarks.benchmark_families alter column research_priority type benchmarks.research_priority_v2
  using (case research_priority::text when 'high' then 'launch' when 'medium' then 'expand' else 'backlog' end)::benchmarks.research_priority_v2;
drop type benchmarks.research_priority;
alter type benchmarks.research_priority_v2 rename to research_priority;
alter table benchmarks.benchmark_families alter column research_priority set default 'backlog';

-- ---------------------------------------------------------------- sources

alter table benchmarks.sources drop constraint sources_key_check;
alter table benchmarks.sources add constraint sources_key_check check (key ~ '^[a-z0-9]+([._-][a-z0-9]+)*$');
alter table benchmarks.sources alter column kind drop not null; -- document type; unknown unless evident
alter table benchmarks.sources add column publisher_name text;
alter table benchmarks.sources add column provenance benchmarks.source_provenance;
alter table benchmarks.sources add column locator text;

-- A retrieval is a date. A time is recorded only when actually captured.
alter table benchmarks.source_snapshots add column retrieved_on date;
alter table benchmarks.source_snapshots disable trigger forbid_update;
update benchmarks.source_snapshots set retrieved_on = (retrieved_at at time zone 'UTC')::date;
alter table benchmarks.source_snapshots enable trigger forbid_update;
alter table benchmarks.source_snapshots alter column retrieved_on set not null;
alter table benchmarks.source_snapshots alter column retrieved_at drop not null;
alter table benchmarks.source_snapshots drop constraint source_snapshots_source_id_retrieved_at_key;
alter table benchmarks.source_snapshots add column snapshot_path text;
-- Capturing a hash or archive later creates a new snapshot rather than editing an old one.
alter table benchmarks.source_snapshots
  add constraint source_snapshots_identity unique nulls not distinct (source_id, retrieved_on, content_hash);

-- ---------------------------------------------------------------- benchmark families

alter table benchmarks.benchmark_families add column research_id text;
update benchmarks.benchmark_families set research_id = slug;
alter table benchmarks.benchmark_families alter column research_id set not null;
alter table benchmarks.benchmark_families add constraint benchmark_families_research_id_key unique (research_id);

alter table benchmarks.benchmark_families add column editorial_track benchmarks.editorial_track;
alter table benchmarks.benchmark_families add column identity_status benchmarks.identity_status not null default 'not_checked';
alter table benchmarks.benchmark_families add column profile_status benchmarks.profile_status not null default 'registry_only';
alter table benchmarks.benchmark_families add column primary_source_id uuid references benchmarks.sources (id);
alter table benchmarks.benchmark_families add column research_notes text;
alter table benchmarks.benchmark_families rename column last_verified_on to checked_on;

drop index benchmarks.benchmark_families_review;
alter table benchmarks.benchmark_families drop column profile_depth;
drop type benchmarks.profile_depth;
create index benchmark_families_review on benchmarks.benchmark_families (review_state, profile_status);
create index benchmark_families_primary_source on benchmarks.benchmark_families (primary_source_id);

alter table benchmarks.benchmark_families add constraint benchmark_families_identity_source
  check (identity_status = 'not_checked' or primary_source_id is not null);
alter table benchmarks.benchmark_families add constraint benchmark_families_publishable_identity
  check (review_state <> 'published' or identity_status = 'primary_source_located');

-- ---------------------------------------------------------------- versions

alter table benchmarks.benchmark_versions add column research_id text unique;
-- Factual column: populated from a published claim (field 'task_count'); see unsupported_facts.
alter table benchmarks.benchmark_versions add column task_count integer check (task_count > 0);
alter table benchmarks.benchmark_versions add column release_date_basis text;
alter table benchmarks.benchmark_versions add column revision_hash text;
alter table benchmarks.benchmark_versions add column pin_status benchmarks.pin_status not null default 'label_only';

alter table benchmarks.benchmark_splits add column research_id text unique;

-- ---------------------------------------------------------------- claims & evidence

alter table benchmarks.claims add column checked_on date;
alter table benchmarks.claims add column notes text;

alter table benchmarks.claim_evidence add column research_id text unique;
alter table benchmarks.claim_evidence add column capture_kind benchmarks.capture_kind not null default 'paraphrase';
alter table benchmarks.claim_evidence add constraint claim_evidence_quotation_has_excerpt
  check (capture_kind <> 'quotation' or excerpt is not null);

-- ---------------------------------------------------------------- relationships

-- Only relationships a source states: each one is backed by a claim (and so by evidence).
alter table benchmarks.benchmark_relationships add column research_id text unique;
alter table benchmarks.benchmark_relationships add column claim_id uuid unique references benchmarks.claims (id) on delete restrict;

-- ---------------------------------------------------------------- audits (attributed findings)

drop table benchmarks.benchmark_audits;
drop type benchmarks.audit_severity;
drop type benchmarks.audit_resolution;

create table benchmarks.benchmark_audits (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  family_id uuid not null references benchmarks.benchmark_families (id) on delete restrict,
  version_id uuid,
  auditor_id uuid references benchmarks.organizations (id),
  auditor_name text not null,
  audit_date date,
  -- The auditor's own verdict, verbatim ("Flawed"). We do not translate it into a severity.
  verdict text not null,
  -- Tasks the audit identifies as affected: a lower bound, not an inferred total.
  affected_tasks_lower_bound integer check (affected_tasks_lower_bound >= 0),
  -- Scope the audit reports reviewing; not necessarily the current dataset size.
  review_task_count integer check (review_task_count > 0),
  summary text,
  remediation_status benchmarks.remediation_status not null default 'not_checked',
  claim_id uuid not null unique references benchmarks.claims (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (version_id, family_id) references benchmarks.benchmark_versions (id, family_id),
  check (affected_tasks_lower_bound is null or review_task_count is null or affected_tasks_lower_bound <= review_task_count)
);
create index benchmark_audits_family on benchmarks.benchmark_audits (family_id);
create index benchmark_audits_version on benchmarks.benchmark_audits (version_id);
create index benchmark_audits_auditor on benchmarks.benchmark_audits (auditor_id);

-- ---------------------------------------------------------------- metric snapshots (with precision)

drop table benchmarks.metric_snapshots;
create table benchmarks.metric_snapshots (
  id bigint generated always as identity primary key,
  research_id text unique,
  subject_id uuid not null references benchmarks.entities (id) on delete restrict,
  metric_id text not null,
  metric_scope benchmarks.metric_scope not null default 'engagement' check (metric_scope = 'engagement'),
  value numeric not null check (value >= 0),
  -- What the source displayed, e.g. "1.9k". With precision 'rounded', `value` is not exact.
  value_display text,
  precision benchmarks.value_precision not null default 'exact',
  observed_on date not null,
  observed_at timestamptz,
  source_snapshot_id uuid references benchmarks.source_snapshots (id),
  ingestion_job_id bigint references benchmarks.ingestion_jobs (id),
  foreign key (metric_id, metric_scope) references benchmarks.metric_definitions (id, scope),
  unique nulls not distinct (subject_id, metric_id, observed_on, source_snapshot_id)
);
create index metric_snapshots_metric on benchmarks.metric_snapshots (metric_id, metric_scope);
create index metric_snapshots_source on benchmarks.metric_snapshots (source_snapshot_id);
create index metric_snapshots_job on benchmarks.metric_snapshots (ingestion_job_id);

-- ---------------------------------------------------------------- research gaps

create table benchmarks.research_gaps (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  family_id uuid not null references benchmarks.benchmark_families (id) on delete restrict,
  priority benchmarks.gap_priority not null,
  gap_type text not null check (gap_type ~ '^[a-z][a-z0-9_]*$'),
  status benchmarks.gap_status not null default 'open',
  next_action text not null check (next_action <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index research_gaps_family on benchmarks.research_gaps (family_id, status);

-- ---------------------------------------------------------------- result observations (staging)

-- Publisher-reported results captured as displayed, awaiting configuration reconciliation.
-- Never ranked or compared while comparison_status = 'not_ready'; never turned into
-- evaluation_runs until model, protocol, metric and denominator are established.
create table benchmarks.result_observations (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  family_id uuid not null references benchmarks.benchmark_families (id) on delete restrict,
  version_id uuid,
  source_snapshot_id uuid not null references benchmarks.source_snapshots (id),
  source_locator text not null,
  model_label text not null,
  effort_label text,
  agent_label text,
  score_percent numeric check (score_percent between 0 and 100),
  interval_halfwidth_pp numeric check (interval_halfwidth_pp >= 0),
  score_display text,
  average_cost_usd numeric check (average_cost_usd >= 0),
  output_tokens_display text,
  steps_display text,
  source_updated_on date,
  observed_on date not null,
  precision benchmarks.value_precision not null,
  origin benchmarks.result_origin not null,
  comparison_status benchmarks.comparison_status not null default 'not_ready',
  missing_context text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (version_id, family_id) references benchmarks.benchmark_versions (id, family_id),
  check (comparison_status <> 'ready' or missing_context is null)
);
create index result_observations_family on benchmarks.result_observations (family_id);
create index result_observations_version on benchmarks.result_observations (version_id);
create index result_observations_source on benchmarks.result_observations (source_snapshot_id);

-- ---------------------------------------------------------------- views

create or replace view benchmarks.unsupported_facts with (security_invoker = true) as
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
    )
  union all
  select 'benchmark_versions', v.id, f.slug || '@' || v.label, 'task_count'
  from benchmarks.benchmark_versions v
  join benchmarks.benchmark_families f on f.id = v.family_id
  where f.review_state = 'published' and v.task_count is not null
    and not exists (
      select 1 from benchmarks.claims c
      where c.subject_id = v.id and c.field = 'task_count' and c.review_state = 'published'
        and c.value_numeric = v.task_count
    );

-- ---------------------------------------------------------------- triggers, RLS, policies

do $$
declare
  t text;
begin
  foreach t in array array['benchmark_audits', 'research_gaps', 'result_observations'] loop
    execute format('create trigger touch_updated_at before update on benchmarks.%I for each row execute function benchmarks.touch_updated_at()', t);
  end loop;
  foreach t in array array['benchmark_audits', 'research_gaps', 'result_observations', 'metric_snapshots', 'benchmark_relationships', 'benchmark_aliases'] loop
    execute format('create trigger record_history after update or delete on benchmarks.%I for each row execute function benchmarks.record_history()', t);
  end loop;
end $$;

-- New tables get the same access model as 0005: RLS on, explicit writer/reader policies.
-- (Grants come from the default privileges set in 0005.) Idempotent for any table missing them.
do $$
declare
  t text;
begin
  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'benchmarks' and c.relkind = 'r'
  loop
    execute format('alter table benchmarks.%I enable row level security', t);
    if not exists (select 1 from pg_policies where schemaname = 'benchmarks' and tablename = t and policyname = 'writer_all') then
      execute format('create policy writer_all on benchmarks.%I for all to benchmarks_writer using (true) with check (true)', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'benchmarks' and tablename = t and policyname = 'reader_select') then
      execute format('create policy reader_select on benchmarks.%I for select to benchmarks_reader using (true)', t);
    end if;
  end loop;
end $$;
