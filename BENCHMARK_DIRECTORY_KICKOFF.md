# Frontier Engineering AI Benchmark Directory

Coding-agent kickoff brief · 6 November 2026

## Goal and audience

Build an independent, evidence-backed benchmark directory connecting capabilities, industry adoption, evaluation results, costs, and methodological limitations. Serve engineers/researchers and enterprise decision-makers through plain-language summaries with expandable technical detail. Support both published third-party results and Frontier Engineering evaluations, clearly attributed.

## V1 scope

- **100–150 registry entries**, with canonical identities and explicit family/version relationships; report family and version counts separately rather than inflating coverage with aliases.
- **12 detailed launch profiles**, expanding to **35** after launch. Prioritize coding, agents, tool/computer use, and enterprise knowledge work; provide lighter coverage of other categories.
- Each registry entry: name, slug, description, entity kind, maintainer, capabilities, official links, research priority, maintenance status, and last verification date.
- Each detailed profile: executive summary, methodology, versions/splits, task coverage, metrics, accessibility/license, reproducibility instructions, sourced results, adoption history, economics, limitations/audits, and explicit missing-data states.
- Exclude exhaustive leaderboard scraping, a universal benchmark-quality score, and large-scale evaluation execution from initial launch. Build the schema and import contract for Frontier runs immediately.

### Research shortlist

Proposed first 12, selected from the conversation's priorities: **DeepSWE, Terminal-Bench, SWE-bench Verified, SWE-Bench Pro, SWE-Lancer, OSWorld, BFCL, τ-bench family, WebArena, APEX-Agents, GDPval, and The Agent Company**. Research DeepSWE and Terminal-Bench first to exercise evidence and cost modeling.

Expand to 35 research profiles with: SWE-bench Multilingual, SWE-bench Multimodal, SWE-rebench, SWE-bench Live, LiveCodeBench, BigCodeBench, Aider Polyglot, BrowserGym, VisualWebArena, GAIA, WebVoyager, AgentDojo, ToolBench, WorkArena, APEX-SWE, APEX-Accounting, APEX-1, OfficeBench, METR Time Horizons, RE-Bench, HCAST, CyberGym, and AgentBench.

These are research candidates, not verified current facts. Verify identity, official sources, versions, and maintenance status before publication; distinguish benchmarks, variants, frameworks, and evaluation studies. Do not assume similarly named projects share a family. Earlier examples involving Meta/Muse, scores, task counts, or audit findings require original-source verification.

## Key features

1. **Directory** (`/benchmarks`): search; capability, domain, status, openness, and evidence filters; dated adoption/engagement sorting.
2. **Profiles** (`/benchmarks/[slug]`): version selector, methodology, configuration-aware results, evidence links, economics, and visible limitations/freshness warnings.
3. **Comparison** (`/benchmarks/compare`): compare benchmark purpose, coverage, accessibility, adoption, and limitations; chart performance only within compatible evaluation groups.
4. **Adoption tracker** (`/benchmarks/adoption`): lab/model-release references with dates, exact passages/table locations, and evidence classification.
5. **Cost estimator**: task count × repetitions × per-task token costs, with dated pricing and explicit caching, retry, tool, and infrastructure assumptions. Separate estimates from measured costs.
6. **Research and evaluations** (`/benchmarks/research`, `/evaluations`): editorial reviews and independently conducted Frontier runs; authenticated review/publish workflow.

## Normalized relational schema

Use PostgreSQL, primary/foreign keys, UTC timestamps, controlled enums, and migrations. Keep queryable relationships relational; reserve JSON for source payloads and configuration extensions.

| Tables | Core fields / relationships |
| --- | --- |
| `organizations` | id, name, type, website; maintainers, model providers, evaluators, publishers |
| `benchmark_families`, `benchmark_aliases` | id, unique slug, name, kind, description, maintainer_id, status, profile_depth; aliases → family |
| `benchmark_versions`, `benchmark_splits` | family_id, version label, release date, dataset hash, harness commit; split → version, name, visibility, task count |
| `capabilities`, `benchmark_capabilities`, `benchmark_relationships` | Many-to-many capability mapping; explicit derivative/variant/related links |
| `licenses`, `benchmark_resources` | Version/family links to dataset, repository, paper, harness, license, and access conditions |
| `models`, `model_configs` | Provider/model/release identity; model_id, immutable config hash, effort, temperature, context, tool mode |
| `agent_configs`, `environment_specs` | Agent version, harness commit, prompt hash, tools; immutable image/site/task/environment identifiers |
| `evaluation_runs` | version_id, split_id, model_config_id, agent_config_id, environment_id, evaluator_id, origin, date, status, repetitions, protocol hash |
| `metric_definitions`, `evaluation_results` | Metric name, unit, direction, aggregation, denominator semantics; run_id, metric_id, original value/unit, normalized value, sample size, confidence interval/method |
| `run_usage`, `pricing_snapshots`, `cost_estimates` | Run tokens by billing category, tool calls, retries, duration, measured API/infra cost; dated rates; estimates with formula, inputs, exclusions, pricing_id |
| `sources`, `source_snapshots` | Canonical URL, publisher, publication date; retrieved_at, content hash, archived/object URL, adapter version |
| `claims`, `claim_evidence` | Typed factual assertion, verification status, reviewed_at; many-to-many claim/source-snapshot links with excerpt or locator and support/dispute role |
| `benchmark_citations`, `benchmark_audits` | Family/version, citing organization/model, evidence type, claim_id; version-specific issue, severity, affected tasks, resolution status, claim_id |
| `metric_snapshots` | Dated GitHub stars/forks, academic citations, downloads, etc.; subject, metric definition, source snapshot, value |
| `ingestion_jobs`, `review_events`, `run_artifacts` | Adapter execution/error history; editorial state transitions; run logs/configs/results and artifact hashes |

Use a shared `entities` identity table or explicit typed junction tables for claims and metric subjects; avoid unenforced `subject_type`/`subject_id` references. Enforce split/version consistency, unique family/version/split identities, and adapter-specific import keys. Preserve corrections and superseded evidence rather than overwriting history.

## Provenance and comparison rules

- Every published factual claim and number must link to evidence, a source date/retrieval date, and a collection method. A document can support multiple claims; a claim can have multiple supporting or conflicting sources.
- Track **verified, reported, estimated, and unverified** per claim. Verifying that a publisher reported a score does not independently reproduce that score. Keep result origin separate: publisher-reported, independent reproduction, or Frontier run.
- Distinguish mention, explicit adoption, score report, reproduction, audit, and Frontier run. A mention is not a run. Deduplicate mirrored reports and repeated citations to the same experiment.
- Label observable counts precisely: “known published evaluations,” “unique model configurations,” “unique citing organizations,” and “documented token usage.” Never imply complete private usage or token totals; show coverage and observation windows.
- Unknown values are `null`, never zero. Incomplete runs are not failures. Retain original units, denominators, and scoring definitions when normalizing values.
- Compare scores only when benchmark version, split, metric, evaluation protocol, and relevant budget/environment settings are compatible. Display model effort, agent/harness, tools, repetitions, and grader. Missing configuration means compatibility is unknown; do not silently rank it as equivalent.
- Separate benchmark popularity, editorial research priority, integrity findings, and enterprise relevance. Surface contamination, grading errors, saturation, and reproducibility caveats beside results.

## Ingestion and suggested stack

Use **Next.js + TypeScript**, server-rendered profiles, a typed API/validation layer, **PostgreSQL** with a migration-capable ORM, a scheduled worker/job queue, and S3-compatible object storage. Reuse an existing project stack where appropriate; these are implementation defaults, not fixed dependencies.

Pipeline: discover → fetch immutable source snapshot → parse into staging → validate identities/units/provenance → deduplicate → review → publish. Keep raw evidence and transformation versions. Retries must be idempotent; failures retain the last valid snapshot with a stale-data warning and an actionable job error.

Start with GitHub metadata, paper citation metadata (OpenAlex/Semantic Scholar), curated official-source imports, and a small number of leaderboard adapters. Add Hugging Face metadata where useful. Respect source access and licensing. Suggested cadence: GitHub/release discovery daily, leaderboards daily–weekly, academic citations weekly–monthly, editorial reviews quarterly or after major revisions. Make freshness thresholds source-specific.

Accept Frontier runs through a versioned import contract containing experiment ID, immutable configurations/environment, outcomes, usage, retries, timestamps, grader details, and artifact links. Never label sample fixtures as real evaluations.

## Phased deliverables

1. **Foundation and registry:** taxonomy, identity rules, migrations, source/evidence model, seed importer, research template, and 100–150 sourced registry entries.
2. **Research pilot:** DeepSWE and Terminal-Bench dossiers; validate schema against real missing/conflicting evidence; complete 12 reviewed launch profiles.
3. **Pipeline and editorial tools:** initial adapters, snapshots, scheduled jobs, review queue, deduplication, freshness indicators, and documented Frontier import contract.
4. **Public launch:** directory, profiles, comparison, adoption tracker, cost estimator, source drill-down, and methodology documentation.
5. **Expansion:** 35 detailed profiles, instrumented Frontier run ingestion, reproducibility artifacts, and cost/reliability analytics.

## Acceptance criteria

- Fresh setup can apply migrations and import seeds using documented steps; secrets remain outside source control.
- Launch has 100–150 deduplicated registry entries and 12 reviewed detailed profiles; expansion reaches 35. Counts distinguish families, versions, and profile types.
- Every published factual number/claim has inspectable evidence and dates; unresolved candidate claims remain unpublished or visibly unverified. No invented scores, costs, citations, or usage counts.
- Search, filters, version selection, comparison, adoption links, and cost estimates work on mobile and desktop with keyboard-accessible controls.
- Published and Frontier results are visibly distinct; incompatible versions/splits/protocols cannot be silently combined into rankings.
- Imports are repeatable without duplication; adapter failures produce stale/error states; corrections retain history; unknown values remain null throughout API and UI.
- Tests cover relational integrity, import idempotency, citation deduplication, compatibility gating, null handling, and cost calculations. Smoke checks cover core browsing flows and source links.
- Handoff includes schema/migrations, adapter and run-import documentation, editorial methodology, refresh operations, and an explicit backlog of missing evidence.

## Planning source

Based on [Benchmark Directory Planning](chatgpt-conversation://6aee054d-19c0-83e9-94d7-5de444d6bfe1). This brief consolidates product decisions and proposed implementation defaults; it does not independently validate the conversation's benchmark facts.
