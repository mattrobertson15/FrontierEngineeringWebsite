-- Benchmark Intelligence Directory — registry core.
--
-- Identity rules
--   * Every row that a claim, metric snapshot or review event can be *about* gets its id from
--     `entities`, so those references are real foreign keys (no unenforced subject_type/subject_id).
--     Subject tables carry a constant `entity_kind` column and a composite FK to entities(id, kind),
--     so an id can never be reused as a different kind of thing.
--   * Natural keys (slugs, family+label, version+name, `key`) are unique and are what importers
--     match on. Surrogate uuids never appear in research files.
--   * Nothing is overwritten silently: updates and deletes on editorial tables are copied to
--     row_history.
--   * Unknown values are NULL, never 0 or ''.
--
-- Isolation: everything lives in the `benchmarks` schema so this registry can share a database
-- with unrelated data (see 0005_access.sql for roles and grants). Nothing is created in `public`.

create schema if not exists benchmarks;
revoke all on schema benchmarks from public;
comment on schema benchmarks is 'Benchmark Intelligence Directory. Self-contained: no references to other schemas.';

-- ---------------------------------------------------------------- enums

create type benchmarks.entity_kind as enum (
  'organization', 'benchmark_family', 'benchmark_version', 'benchmark_split',
  'model', 'model_config', 'claim', 'evaluation_run', 'evaluation_result'
);
create type benchmarks.organization_type as enum ('lab', 'academic', 'company', 'nonprofit', 'independent', 'government');
create type benchmarks.benchmark_kind as enum ('benchmark', 'suite', 'framework', 'evaluation_study', 'index', 'unclassified');
create type benchmarks.maintenance_status as enum ('active', 'unmaintained', 'superseded', 'deprecated', 'unknown');
create type benchmarks.profile_depth as enum ('registry', 'detailed');
create type benchmarks.research_priority as enum ('high', 'medium', 'low');
create type benchmarks.review_state as enum ('draft', 'in_review', 'published', 'retracted');
create type benchmarks.split_visibility as enum ('public', 'semi_private', 'private', 'unknown');
create type benchmarks.date_precision as enum ('year', 'month', 'day');
create type benchmarks.capability_axis as enum ('capability', 'domain');
create type benchmarks.relationship_kind as enum ('variant_of', 'derived_from', 'successor_of', 'subset_of', 'related_to');
create type benchmarks.resource_kind as enum ('paper', 'repository', 'dataset', 'harness', 'website', 'leaderboard', 'documentation');
create type benchmarks.license_category as enum ('permissive', 'copyleft', 'non_commercial', 'proprietary', 'custom', 'unknown');
create type benchmarks.job_status as enum ('running', 'succeeded', 'failed');

-- ---------------------------------------------------------------- shared machinery

create table benchmarks.entities (
  id uuid primary key default gen_random_uuid(),
  kind benchmarks.entity_kind not null,
  created_at timestamptz not null default now(),
  unique (id, kind)
);

-- BEFORE INSERT on a subject table: mint its entity row. TG_ARGV[0] is the entity kind.
create function benchmarks.assign_entity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.id is null then
    insert into benchmarks.entities (kind) values (tg_argv[0]::benchmarks.entity_kind) returning id into new.id;
  else
    insert into benchmarks.entities (id, kind) values (new.id, tg_argv[0]::benchmarks.entity_kind)
    on conflict (id) do nothing;
  end if;
  return new;
end $$;

-- AFTER DELETE on a subject table: drop its now-unused entity row.
create function benchmarks.release_entity() returns trigger
language plpgsql set search_path = '' as $$
begin
  delete from benchmarks.entities where id = old.id;
  return old;
end $$;

create function benchmarks.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Corrections keep history: every UPDATE/DELETE on an editorial table stores the prior row.
create table benchmarks.row_history (
  id bigint generated always as identity primary key,
  table_name text not null,
  row_id text not null,
  op text not null check (op in ('UPDATE', 'DELETE')),
  old_row jsonb not null,
  changed_at timestamptz not null default now()
);
create index row_history_lookup on benchmarks.row_history (table_name, row_id, changed_at desc);

create function benchmarks.record_history() returns trigger
language plpgsql set search_path = '' as $$
declare
  old_json jsonb := to_jsonb(old);
begin
  if tg_op = 'UPDATE' and (old_json - 'updated_at') = (to_jsonb(new) - 'updated_at') then
    return new; -- no-op update: nothing to remember
  end if;
  insert into benchmarks.row_history (table_name, row_id, op, old_row)
  values (tg_table_name, coalesce(old_json ->> 'id', old_json ->> 'key', old_json ->> 'slug'), tg_op, old_json);
  return coalesce(new, old);
end $$;

-- For identity rows that must never change once written (configs, environments).
create function benchmarks.forbid_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception '% rows are immutable; insert a new row instead', tg_table_name
    using errcode = 'check_violation';
end $$;

-- ---------------------------------------------------------------- ingestion jobs

create table benchmarks.ingestion_jobs (
  id bigint generated always as identity primary key,
  adapter text not null,
  adapter_version text not null,
  git_commit text,
  status benchmarks.job_status not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  stats jsonb,
  error text,
  check ((status = 'running') = (finished_at is null)),
  check (status <> 'failed' or error is not null)
);
create index ingestion_jobs_adapter_started on benchmarks.ingestion_jobs (adapter, started_at desc);

-- ---------------------------------------------------------------- organizations

create table benchmarks.organizations (
  id uuid primary key,
  entity_kind benchmarks.entity_kind not null default 'organization' check (entity_kind = 'organization'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (name <> ''),
  type benchmarks.organization_type not null,
  website text check (website ~ '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (id, entity_kind) references benchmarks.entities (id, kind) on delete cascade
);

-- ---------------------------------------------------------------- taxonomy

create table benchmarks.capabilities (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  axis benchmarks.capability_axis not null,
  name text not null,
  description text,
  parent_slug text references benchmarks.capabilities (slug)
);
create index capabilities_parent on benchmarks.capabilities (parent_slug);

create table benchmarks.licenses (
  slug text primary key check (slug ~ '^[a-z0-9]+([.-][a-z0-9]+)*$'),
  name text not null,
  spdx_id text unique,
  category benchmarks.license_category not null,
  url text check (url ~ '^https?://')
);

-- ---------------------------------------------------------------- benchmark families

create table benchmarks.benchmark_families (
  id uuid primary key,
  entity_kind benchmarks.entity_kind not null default 'benchmark_family' check (entity_kind = 'benchmark_family'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (name <> ''),
  kind benchmarks.benchmark_kind not null,
  summary text check (char_length(summary) <= 280),
  description text,
  -- Factual column: populated from a published claim (field 'maintainer'); see unsupported_facts.
  maintainer_id uuid references benchmarks.organizations (id),
  status benchmarks.maintenance_status not null default 'unknown',
  profile_depth benchmarks.profile_depth not null default 'registry',
  research_priority benchmarks.research_priority not null default 'medium',
  review_state benchmarks.review_state not null default 'draft',
  reviewed_at timestamptz,
  last_verified_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (id, entity_kind) references benchmarks.entities (id, kind) on delete cascade,
  -- Published entries must be classified, reviewed and verified.
  check (review_state <> 'published' or (kind <> 'unclassified' and reviewed_at is not null and last_verified_on is not null and summary is not null))
);
create index benchmark_families_maintainer on benchmarks.benchmark_families (maintainer_id);
create index benchmark_families_review on benchmarks.benchmark_families (review_state, profile_depth);

create table benchmarks.benchmark_aliases (
  id bigint generated always as identity primary key,
  family_id uuid not null references benchmarks.benchmark_families (id) on delete cascade,
  alias text not null check (alias <> '')
);
-- An alias resolves to exactly one family, case-insensitively.
create unique index benchmark_aliases_unique on benchmarks.benchmark_aliases (lower(alias));
create index benchmark_aliases_family on benchmarks.benchmark_aliases (family_id);

create table benchmarks.benchmark_versions (
  id uuid primary key,
  entity_kind benchmarks.entity_kind not null default 'benchmark_version' check (entity_kind = 'benchmark_version'),
  family_id uuid not null references benchmarks.benchmark_families (id) on delete restrict,
  label text not null check (label <> ''),
  -- Factual columns: populated from published claims (field 'released_on').
  released_on date,
  released_precision benchmarks.date_precision,
  is_default boolean not null default false,
  dataset_hash text,
  harness_commit text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (id, entity_kind) references benchmarks.entities (id, kind) on delete cascade,
  unique (family_id, label),
  unique (id, family_id), -- target for composite FKs that pin a version to its family
  check ((released_on is null) = (released_precision is null))
);
create unique index benchmark_versions_one_default on benchmarks.benchmark_versions (family_id) where is_default;

create table benchmarks.benchmark_splits (
  id uuid primary key,
  entity_kind benchmarks.entity_kind not null default 'benchmark_split' check (entity_kind = 'benchmark_split'),
  version_id uuid not null references benchmarks.benchmark_versions (id) on delete restrict,
  name text not null check (name <> ''),
  visibility benchmarks.split_visibility not null default 'unknown',
  -- Factual column: populated from a published claim (field 'task_count').
  task_count integer check (task_count > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (id, entity_kind) references benchmarks.entities (id, kind) on delete cascade,
  unique (version_id, name),
  unique (id, version_id) -- target for composite FKs that pin a split to its version
);

create table benchmarks.benchmark_capabilities (
  family_id uuid not null references benchmarks.benchmark_families (id) on delete cascade,
  capability_slug text not null references benchmarks.capabilities (slug),
  is_primary boolean not null default false,
  primary key (family_id, capability_slug)
);
create index benchmark_capabilities_capability on benchmarks.benchmark_capabilities (capability_slug);
create unique index benchmark_capabilities_one_primary on benchmarks.benchmark_capabilities (family_id) where is_primary;

create table benchmarks.benchmark_relationships (
  subject_family_id uuid not null references benchmarks.benchmark_families (id) on delete cascade,
  kind benchmarks.relationship_kind not null,
  object_family_id uuid not null references benchmarks.benchmark_families (id) on delete cascade,
  notes text,
  primary key (subject_family_id, kind, object_family_id),
  check (subject_family_id <> object_family_id)
);
create index benchmark_relationships_object on benchmarks.benchmark_relationships (object_family_id);

create table benchmarks.benchmark_resources (
  id bigint generated always as identity primary key,
  family_id uuid not null references benchmarks.benchmark_families (id) on delete cascade,
  version_id uuid,
  kind benchmarks.resource_kind not null,
  url text not null check (url ~ '^https?://'),
  license_slug text references benchmarks.licenses (slug),
  access_conditions text,
  foreign key (version_id, family_id) references benchmarks.benchmark_versions (id, family_id) on delete cascade,
  unique nulls not distinct (family_id, version_id, kind, url)
);
create index benchmark_resources_version on benchmarks.benchmark_resources (version_id);
create index benchmark_resources_license on benchmarks.benchmark_resources (license_slug);

-- ---------------------------------------------------------------- models

create table benchmarks.models (
  id uuid primary key,
  entity_kind benchmarks.entity_kind not null default 'model' check (entity_kind = 'model'),
  slug text not null unique check (slug ~ '^[a-z0-9]+([.-][a-z0-9]+)*$'),
  name text not null,
  provider_id uuid not null references benchmarks.organizations (id),
  open_weights boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (id, entity_kind) references benchmarks.entities (id, kind) on delete cascade
);
create index models_provider on benchmarks.models (provider_id);

-- ---------------------------------------------------------------- triggers

do $$
declare
  t record;
begin
  for t in select * from (values
    ('organizations', 'organization'),
    ('benchmark_families', 'benchmark_family'),
    ('benchmark_versions', 'benchmark_version'),
    ('benchmark_splits', 'benchmark_split'),
    ('models', 'model')
  ) as v(tbl, kind) loop
    execute format('create trigger assign_entity before insert on benchmarks.%I for each row execute function benchmarks.assign_entity(%L)', t.tbl, t.kind);
    execute format('create trigger release_entity after delete on benchmarks.%I for each row execute function benchmarks.release_entity()', t.tbl);
    execute format('create trigger touch_updated_at before update on benchmarks.%I for each row execute function benchmarks.touch_updated_at()', t.tbl);
    execute format('create trigger record_history after update or delete on benchmarks.%I for each row execute function benchmarks.record_history()', t.tbl);
  end loop;
end $$;
