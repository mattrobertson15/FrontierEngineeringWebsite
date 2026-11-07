-- Benchmark Intelligence Directory — evaluation runs, results, usage and cost.
--
-- Rules enforced here
--   * A run pins the exact benchmark version and (when known) split; the split must belong to that
--     version. Model, agent and environment configurations are immutable and identified by hash.
--   * Origin is explicit: publisher-reported, independent reproduction, or Frontier run.
--     Anything not run by Frontier must point at the claim (and so the evidence) it came from.
--   * A run that did not finish is 'incomplete', not a failure, and gets no results by default.
--   * Results keep the original value and unit; normalized values sit beside them, never replace.
--   * Measured cost (run_usage) and estimated cost (cost_estimates) live in separate tables.

create type benchmarks.result_origin as enum ('publisher_reported', 'independent_reproduction', 'frontier_run');
create type benchmarks.run_status as enum ('planned', 'running', 'completed', 'incomplete', 'failed', 'cancelled');
create type benchmarks.token_category as enum ('input', 'cache_read', 'cache_write', 'reasoning', 'output');
create type benchmarks.artifact_kind as enum ('log', 'config', 'results', 'trajectory', 'other');

-- ---------------------------------------------------------------- configurations (immutable)

create table benchmarks.model_configs (
  id uuid primary key,
  entity_kind benchmarks.entity_kind not null default 'model_config' check (entity_kind = 'model_config'),
  model_id uuid not null references benchmarks.models (id),
  -- sha256 of the canonical JSON of every field below; computed by the importer.
  config_hash text not null unique check (config_hash ~ '^[0-9a-f]{64}$'),
  reasoning_effort text,
  temperature numeric check (temperature >= 0),
  max_context_tokens integer check (max_context_tokens > 0),
  tool_mode text,
  extra jsonb not null default '{}',
  created_at timestamptz not null default now(),
  foreign key (id, entity_kind) references benchmarks.entities (id, kind) on delete cascade
);
create index model_configs_model on benchmarks.model_configs (model_id);

create table benchmarks.agent_configs (
  id uuid primary key default gen_random_uuid(),
  config_hash text not null unique check (config_hash ~ '^[0-9a-f]{64}$'),
  name text not null,
  version text,
  harness_commit text,
  prompt_hash text,
  tools text[] not null default '{}',
  extra jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table benchmarks.environment_specs (
  id uuid primary key default gen_random_uuid(),
  spec_hash text not null unique check (spec_hash ~ '^[0-9a-f]{64}$'),
  image text,
  image_digest text,
  description text,
  extra jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create trigger assign_entity before insert on benchmarks.model_configs
  for each row execute function benchmarks.assign_entity('model_config');
create trigger release_entity after delete on benchmarks.model_configs
  for each row execute function benchmarks.release_entity();
create trigger forbid_update before update on benchmarks.model_configs
  for each row execute function benchmarks.forbid_update();
create trigger forbid_update before update on benchmarks.agent_configs
  for each row execute function benchmarks.forbid_update();
create trigger forbid_update before update on benchmarks.environment_specs
  for each row execute function benchmarks.forbid_update();

-- ---------------------------------------------------------------- runs

create table benchmarks.evaluation_runs (
  id uuid primary key,
  entity_kind benchmarks.entity_kind not null default 'evaluation_run' check (entity_kind = 'evaluation_run'),
  -- Experiment id from the import contract; stable across re-imports.
  key text not null unique check (key ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  version_id uuid not null references benchmarks.benchmark_versions (id),
  split_id uuid,
  model_config_id uuid not null references benchmarks.model_configs (id),
  agent_config_id uuid references benchmarks.agent_configs (id),
  environment_id uuid references benchmarks.environment_specs (id),
  evaluator_id uuid not null references benchmarks.organizations (id),
  origin benchmarks.result_origin not null,
  status benchmarks.run_status not null,
  repetitions integer check (repetitions > 0),
  grader text,
  protocol_hash text,
  started_at timestamptz,
  completed_at timestamptz,
  claim_id uuid references benchmarks.claims (id),
  -- sha256 of the imported payload; a re-import must match or be rejected (runs are immutable).
  import_hash text check (import_hash ~ '^[0-9a-f]{64}$'),
  -- Test fixtures are never real evaluations and are excluded from every public view.
  is_fixture boolean not null default false,
  ingestion_job_id bigint references benchmarks.ingestion_jobs (id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (id, entity_kind) references benchmarks.entities (id, kind) on delete cascade,
  foreign key (split_id, version_id) references benchmarks.benchmark_splits (id, version_id),
  check (origin = 'frontier_run' or claim_id is not null),
  check (completed_at is null or started_at is null or completed_at >= started_at)
);
create index evaluation_runs_version on benchmarks.evaluation_runs (version_id, split_id);
create index evaluation_runs_split on benchmarks.evaluation_runs (split_id);
create index evaluation_runs_model_config on benchmarks.evaluation_runs (model_config_id);
create index evaluation_runs_agent_config on benchmarks.evaluation_runs (agent_config_id);
create index evaluation_runs_environment on benchmarks.evaluation_runs (environment_id);
create index evaluation_runs_evaluator on benchmarks.evaluation_runs (evaluator_id);
create index evaluation_runs_claim on benchmarks.evaluation_runs (claim_id);
create index evaluation_runs_job on benchmarks.evaluation_runs (ingestion_job_id);

create table benchmarks.evaluation_results (
  id uuid primary key,
  entity_kind benchmarks.entity_kind not null default 'evaluation_result' check (entity_kind = 'evaluation_result'),
  run_id uuid not null references benchmarks.evaluation_runs (id) on delete cascade,
  metric_id text not null,
  metric_scope benchmarks.metric_scope not null default 'evaluation' check (metric_scope = 'evaluation'),
  original_value numeric not null,
  original_unit text not null,
  normalized_value numeric,
  sample_size integer check (sample_size > 0),
  ci_low numeric,
  ci_high numeric,
  ci_level numeric check (ci_level > 0 and ci_level < 1),
  ci_method text,
  created_at timestamptz not null default now(),
  foreign key (id, entity_kind) references benchmarks.entities (id, kind) on delete cascade,
  foreign key (metric_id, metric_scope) references benchmarks.metric_definitions (id, scope),
  unique (run_id, metric_id),
  check (num_nonnulls(ci_low, ci_high, ci_level, ci_method) in (0, 4)),
  check (ci_low is null or ci_low <= ci_high)
);
create index evaluation_results_metric on benchmarks.evaluation_results (metric_id, metric_scope);

create trigger assign_entity before insert on benchmarks.evaluation_runs
  for each row execute function benchmarks.assign_entity('evaluation_run');
create trigger release_entity after delete on benchmarks.evaluation_runs
  for each row execute function benchmarks.release_entity();
create trigger touch_updated_at before update on benchmarks.evaluation_runs
  for each row execute function benchmarks.touch_updated_at();
create trigger record_history after update or delete on benchmarks.evaluation_runs
  for each row execute function benchmarks.record_history();
create trigger assign_entity before insert on benchmarks.evaluation_results
  for each row execute function benchmarks.assign_entity('evaluation_result');
create trigger release_entity after delete on benchmarks.evaluation_results
  for each row execute function benchmarks.release_entity();
create trigger record_history after update or delete on benchmarks.evaluation_results
  for each row execute function benchmarks.record_history();

-- ---------------------------------------------------------------- measured usage

-- Observed usage for one run. Every field is nullable: unknown is not zero.
create table benchmarks.run_usage (
  run_id uuid primary key references benchmarks.evaluation_runs (id) on delete cascade,
  attempts_planned integer check (attempts_planned >= 0),
  attempts_completed integer check (attempts_completed >= 0),
  tool_calls bigint check (tool_calls >= 0),
  retries integer check (retries >= 0),
  duration_seconds numeric check (duration_seconds >= 0),
  api_cost_usd numeric check (api_cost_usd >= 0),
  infra_cost_usd numeric check (infra_cost_usd >= 0),
  -- Share of attempts that have cost data, 0–1. Cost figures cover only this share.
  cost_coverage numeric check (cost_coverage between 0 and 1),
  check (attempts_completed is null or attempts_planned is null or attempts_completed <= attempts_planned)
);

create table benchmarks.run_token_usage (
  run_id uuid not null references benchmarks.evaluation_runs (id) on delete cascade,
  category benchmarks.token_category not null,
  tokens bigint not null check (tokens >= 0),
  primary key (run_id, category)
);

create table benchmarks.run_artifacts (
  id bigint generated always as identity primary key,
  run_id uuid not null references benchmarks.evaluation_runs (id) on delete cascade,
  kind benchmarks.artifact_kind not null,
  url text not null check (url ~ '^(https?|s3)://'),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  bytes bigint check (bytes >= 0),
  unique (run_id, url)
);

-- ---------------------------------------------------------------- pricing & estimates

create table benchmarks.pricing_snapshots (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references benchmarks.models (id),
  category benchmarks.token_category not null,
  usd_per_million_tokens numeric not null check (usd_per_million_tokens >= 0),
  effective_on date not null,
  source_snapshot_id uuid not null references benchmarks.source_snapshots (id),
  unique (model_id, category, effective_on)
);
create index pricing_snapshots_source on benchmarks.pricing_snapshots (source_snapshot_id);

-- An estimate, never a measurement: formula, inputs and exclusions are stored with it.
create table benchmarks.cost_estimates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  version_id uuid not null references benchmarks.benchmark_versions (id),
  split_id uuid,
  model_id uuid not null references benchmarks.models (id),
  formula text not null,
  inputs jsonb not null,
  exclusions text[] not null default '{}',
  estimated_usd numeric not null check (estimated_usd >= 0),
  computed_at timestamptz not null default now(),
  foreign key (split_id, version_id) references benchmarks.benchmark_splits (id, version_id)
);
create index cost_estimates_version on benchmarks.cost_estimates (version_id, split_id);
create index cost_estimates_split on benchmarks.cost_estimates (split_id);
create index cost_estimates_model on benchmarks.cost_estimates (model_id);

create table benchmarks.cost_estimate_pricing (
  estimate_id uuid not null references benchmarks.cost_estimates (id) on delete cascade,
  pricing_id uuid not null references benchmarks.pricing_snapshots (id),
  primary key (estimate_id, pricing_id)
);
create index cost_estimate_pricing_pricing on benchmarks.cost_estimate_pricing (pricing_id);
