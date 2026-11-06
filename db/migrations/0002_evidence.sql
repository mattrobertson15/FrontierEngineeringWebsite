-- Benchmark Intelligence Directory — sources, claims and evidence.
--
-- Provenance rules enforced here
--   * A claim is a typed factual assertion about one entity. A published claim must have at
--     least one *supporting* piece of evidence (checked at commit time).
--   * Evidence links a claim to an immutable source snapshot (what we read, and when), with a
--     locator (page, section, table) and an optional short excerpt. One snapshot can support many
--     claims; a claim can have supporting and disputing evidence.
--   * Verification status (verified / reported / estimated / unverified) is per claim. Confirming
--     that a publisher reported a number is 'reported', not 'verified'.
--   * Citations distinguish a mention from adoption, a score report, a reproduction, an audit and a
--     Frontier run, and are deduplicated by the database.

create type benchmarks.verification_status as enum ('verified', 'reported', 'estimated', 'unverified');
create type benchmarks.evidence_role as enum ('supports', 'disputes', 'context');
create type benchmarks.source_kind as enum (
  'paper', 'model_card', 'system_card', 'blog_post', 'leaderboard', 'repository',
  'dataset_card', 'documentation', 'news', 'other'
);
create type benchmarks.citation_kind as enum (
  'mention', 'explicit_adoption', 'score_report', 'reproduction', 'audit', 'frontier_run'
);
create type benchmarks.metric_scope as enum ('evaluation', 'engagement');
create type benchmarks.metric_direction as enum ('higher_is_better', 'lower_is_better', 'neutral');
create type benchmarks.audit_severity as enum ('low', 'medium', 'high', 'critical');
create type benchmarks.audit_resolution as enum ('open', 'acknowledged', 'resolved', 'wont_fix', 'disputed');

-- ---------------------------------------------------------------- sources

create table benchmarks.sources (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9]+([.-][a-z0-9]+)*$'),
  canonical_url text not null unique check (canonical_url ~ '^https?://'),
  title text not null,
  kind benchmarks.source_kind not null,
  publisher_id uuid references benchmarks.organizations (id),
  published_on date,
  published_precision benchmarks.date_precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((published_on is null) = (published_precision is null))
);
create index sources_publisher on benchmarks.sources (publisher_id);

-- One retrieval of a source. Never edited: a re-read is a new snapshot.
create table benchmarks.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references benchmarks.sources (id) on delete restrict,
  retrieved_at timestamptz not null,
  content_hash text check (content_hash ~ '^[0-9a-f]{64}$'),
  archive_url text check (archive_url ~ '^https?://'),
  adapter text not null default 'manual',
  adapter_version text,
  ingestion_job_id bigint references benchmarks.ingestion_jobs (id),
  unique (source_id, retrieved_at)
);
create index source_snapshots_job on benchmarks.source_snapshots (ingestion_job_id);
create trigger forbid_update before update on benchmarks.source_snapshots
  for each row execute function benchmarks.forbid_update();

-- ---------------------------------------------------------------- claims

create table benchmarks.claims (
  id uuid primary key,
  entity_kind benchmarks.entity_kind not null default 'claim' check (entity_kind = 'claim'),
  key text not null unique,
  subject_id uuid not null references benchmarks.entities (id) on delete restrict,
  field text not null check (field ~ '^[a-z][a-z0-9_]*$'),
  statement text not null check (statement <> ''),
  value_text text,
  value_numeric numeric,
  value_date date,
  value_date_precision benchmarks.date_precision,
  unit text,
  status benchmarks.verification_status not null default 'unverified',
  review_state benchmarks.review_state not null default 'draft',
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (id, entity_kind) references benchmarks.entities (id, kind) on delete cascade,
  check ((value_date is null) = (value_date_precision is null)),
  check (num_nonnulls(value_text, value_numeric, value_date) <= 1),
  check (review_state <> 'published' or reviewed_at is not null)
);
create index claims_subject_field on benchmarks.claims (subject_id, field);
create index claims_review on benchmarks.claims (review_state);

create table benchmarks.claim_evidence (
  id bigint generated always as identity primary key,
  claim_id uuid not null references benchmarks.claims (id) on delete cascade,
  snapshot_id uuid not null references benchmarks.source_snapshots (id) on delete restrict,
  role benchmarks.evidence_role not null default 'supports',
  locator text not null check (locator <> ''),
  excerpt text check (char_length(excerpt) <= 500),
  unique (claim_id, snapshot_id, locator)
);
create index claim_evidence_snapshot on benchmarks.claim_evidence (snapshot_id);

-- A published claim needs supporting evidence. Deferred to commit so a claim and its evidence
-- can be written in either order inside one transaction.
create function benchmarks.check_claim_evidence() returns trigger
language plpgsql set search_path = '' as $$
declare
  target uuid;
begin
  -- Separate branches: PL/pgSQL resolves every field reference in an expression, and the
  -- claims row has no claim_id.
  if tg_table_name = 'claims' then
    target := new.id;
  else
    target := old.claim_id;
  end if;
  if exists (
    select 1 from benchmarks.claims c
    where c.id = target and c.review_state = 'published'
      and not exists (
        select 1 from benchmarks.claim_evidence e where e.claim_id = c.id and e.role = 'supports'
      )
  ) then
    raise exception 'published claim % has no supporting evidence', target using errcode = 'check_violation';
  end if;
  return null;
end $$;

create constraint trigger claims_need_evidence
  after insert or update on benchmarks.claims
  deferrable initially deferred
  for each row execute function benchmarks.check_claim_evidence();

create constraint trigger evidence_removal_keeps_support
  after update or delete on benchmarks.claim_evidence
  deferrable initially deferred
  for each row execute function benchmarks.check_claim_evidence();

-- ---------------------------------------------------------------- metrics

create table benchmarks.metric_definitions (
  id text primary key check (id ~ '^[a-z][a-z0-9_]*$'),
  scope benchmarks.metric_scope not null,
  name text not null,
  unit text not null,
  direction benchmarks.metric_direction not null,
  aggregation text,
  -- What the denominator counts, e.g. "planned attempts; missing attempts count as failures".
  denominator text,
  description text,
  unique (id, scope)
);

-- Dated popularity / engagement readings (GitHub stars, citations, downloads).
create table benchmarks.metric_snapshots (
  id bigint generated always as identity primary key,
  subject_id uuid not null references benchmarks.entities (id) on delete restrict,
  metric_id text not null,
  metric_scope benchmarks.metric_scope not null default 'engagement' check (metric_scope = 'engagement'),
  value numeric not null check (value >= 0),
  observed_at timestamptz not null,
  source_snapshot_id uuid references benchmarks.source_snapshots (id),
  ingestion_job_id bigint references benchmarks.ingestion_jobs (id),
  foreign key (metric_id, metric_scope) references benchmarks.metric_definitions (id, scope),
  unique (subject_id, metric_id, observed_at)
);
create index metric_snapshots_metric on benchmarks.metric_snapshots (metric_id, metric_scope);
create index metric_snapshots_source on benchmarks.metric_snapshots (source_snapshot_id);
create index metric_snapshots_job on benchmarks.metric_snapshots (ingestion_job_id);

-- ---------------------------------------------------------------- citations & audits

create table benchmarks.benchmark_citations (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  family_id uuid not null references benchmarks.benchmark_families (id) on delete restrict,
  version_id uuid,
  citing_org_id uuid not null references benchmarks.organizations (id),
  model_id uuid references benchmarks.models (id),
  kind benchmarks.citation_kind not null,
  cited_on date not null,
  cited_precision benchmarks.date_precision not null,
  -- The claim carries the evidence and review state.
  claim_id uuid not null unique references benchmarks.claims (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (version_id, family_id) references benchmarks.benchmark_versions (id, family_id),
  -- Mirrored reports and repeated citations of one experiment collapse to one row.
  unique nulls not distinct (family_id, version_id, citing_org_id, model_id, kind, cited_on)
);
create index benchmark_citations_version on benchmarks.benchmark_citations (version_id);
create index benchmark_citations_org on benchmarks.benchmark_citations (citing_org_id);
create index benchmark_citations_model on benchmarks.benchmark_citations (model_id);

create table benchmarks.benchmark_audits (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  family_id uuid not null references benchmarks.benchmark_families (id) on delete restrict,
  version_id uuid,
  title text not null,
  issue text not null,
  severity benchmarks.audit_severity not null,
  affected_tasks integer check (affected_tasks >= 0),
  resolution benchmarks.audit_resolution not null default 'open',
  reported_on date not null,
  reported_precision benchmarks.date_precision not null,
  claim_id uuid not null unique references benchmarks.claims (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (version_id, family_id) references benchmarks.benchmark_versions (id, family_id)
);
create index benchmark_audits_family on benchmarks.benchmark_audits (family_id);
create index benchmark_audits_version on benchmarks.benchmark_audits (version_id);

-- ---------------------------------------------------------------- review events

-- Editorial state transitions. With git-based review, the importer writes one per change and
-- records the commit that carried it.
create table benchmarks.review_events (
  id bigint generated always as identity primary key,
  subject_id uuid not null references benchmarks.entities (id) on delete cascade,
  from_state benchmarks.review_state,
  to_state benchmarks.review_state not null,
  git_commit text,
  actor text,
  note text,
  ingestion_job_id bigint references benchmarks.ingestion_jobs (id),
  at timestamptz not null default now(),
  check (from_state is distinct from to_state)
);
create index review_events_subject on benchmarks.review_events (subject_id, at desc);
create index review_events_job on benchmarks.review_events (ingestion_job_id);

-- ---------------------------------------------------------------- triggers

create trigger assign_entity before insert on benchmarks.claims
  for each row execute function benchmarks.assign_entity('claim');
create trigger release_entity after delete on benchmarks.claims
  for each row execute function benchmarks.release_entity();

do $$
declare
  t text;
begin
  foreach t in array array['sources', 'claims', 'benchmark_citations', 'benchmark_audits'] loop
    execute format('create trigger touch_updated_at before update on benchmarks.%I for each row execute function benchmarks.touch_updated_at()', t);
  end loop;
  foreach t in array array['sources', 'claims', 'claim_evidence', 'benchmark_citations', 'benchmark_audits', 'metric_definitions'] loop
    execute format('create trigger record_history after update or delete on benchmarks.%I for each row execute function benchmarks.record_history()', t);
  end loop;
end $$;
