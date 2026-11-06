# Data dictionary — v0.1

This is a relational research-staging package. `manifest.json` enumerates every column, inferred primitive type, nullability, primary key and cross-file reference. The definitions below supply semantics that CSV cannot carry. No arrays or nested objects are embedded in cells.

## Shared conventions

- `*_id`: stable text identifier. References must resolve to the corresponding table. `slug` is the proposed public route identifier; do not use a changing name as a key.
- `*_on`, `*_date`: ISO `YYYY-MM-DD`, imported as a date. Blank means unknown. No collection time has been fabricated.
- `source_id` / `primary_source_id`: evidence document in `sources`; a primary source is the document's originator, including an auditor publishing its own audit.
- Empty CSV field: database null. An actual 0 remains numeric 0. Empty strings are not distinguished from null in this package.
- Descriptions and locators are editorial paraphrases, not verbatim quotations. Exact quotes were not preserved.

## benchmarks

`benchmark_id`, `slug`, `name`: identity and display fields. `entity_kind`: benchmark, variant, benchmark_family, framework, evaluation_study, evaluation_environment, benchmark_and_agent, or benchmark_and_platform. The combined kinds flag projects whose parts still need separate modeling.

`editorial_track`: coding, agents, enterprise or reliability; this is our research assignment, not an objective ranking. `research_priority`: pilot (first two), launch (other ten), expand (remaining 23), supporting (parent-only record). `summary`: short sourced scope description. `primary_source_id`: identity evidence. `identity_status=primary_source_located`: primary evidence found, no claim of a full audit. `profile_status`: pilot_draft or registry_only. `checked_on`: research date. `notes`: editorial caveats and identity distinctions.

## versions

`version_id`, `benchmark_id`: version identity and owning registry entry. `version_label`: exact displayed release label. `release_date`: known dated release announcement; `date_basis` explains it and must not be treated as a first commit timestamp. `task_count`: source-reported count for that version, left null when not established. `source_id`: version evidence. `revision_hash`: source-disclosed commit, possibly abbreviated. `pin_status`: label_only or source_short_commit; neither means a full immutable environment has been captured.

## sources

`source_id`, `url`, `title`, `publisher`: document identity and attribution. `published_on`: established publication date, otherwise null. `checked_on`: retrieval date. `source_kind`: primary or independent_audit. `access_method=web_text`: retrieved web text, not a complete archived page. `locator`: relevant section. `snapshot_path`, `content_hash`: null until immutable source capture is implemented.

## claims and claim_evidence

`claim_id`, `benchmark_id`, optional `version_id`: subject. `predicate`: property asserted, such as task_count or audit_verdict. `value`: original interpreted value serialized as text. `value_type`: number or text; numeric consumers must check unit and predicate. `unit`: tasks, languages, repositories, occupations, or null for categorical statements. `verification_status=reported`: attributed source assertion, not independent reproduction. `checked_on`, `notes`: review date and qualification.

`evidence_id`, `claim_id`, `source_id`: many-to-many evidence junction. `locator`: source heading/card/paragraph. `evidence_role=supports`: source supports the claim as written. `capture_kind=paraphrase`: no verbatim quotation. Conflicting task-count claims can each have supporting evidence without either being promoted to canonical truth.

## relationships

`relationship_id`, `from_benchmark_id`, `relationship_type`, `to_benchmark_id`, `source_id`: directed sourced link. This batch uses variant_of for the three SWE-bench variants. It does not infer relationships solely from similar names.

## result_observations

`observation_id`, `benchmark_id`, `version_id`, `source_id`, `source_locator`: provenance for one sampled card. `model_label`, `effort_label`, `agent_label`: displayed or source-documented labels, not normalized model/configuration IDs.

`score_percent`: score on a 0–100 scale, never a 0–1 fraction. `interval_halfwidth_pp`: displayed ± interval in percentage points; its method/confidence level is unconfirmed for this sample. `score_display`: original rounded score string. `average_cost_usd`: displayed average cost, with denominator not yet established. `output_tokens_display`: retain rounded strings such as 30k; do not treat them as precise totals. `steps_display`: displayed step figure, averaging basis unconfirmed.

`source_updated_on`: date printed by the page, not experiment time. `observed_on`: retrieval date. `precision=rounded_display`, `origin=publisher_reported`, `comparison_status=not_ready`: restrictions on use. `missing_context`: specific prerequisites for promotion. Do not total these rows as all published runs, deduce exact pass counts, or use them for a fair ranking.

## audits

`audit_id`, `benchmark_id`, `version_id`: version-specific assessment identity. `auditor`, `audit_date`, `verdict`: original auditor attribution. `affected_tasks_lower_bound`: number of tasks the audit identifies as affected, not a statistically inferred total. `review_task_count`: scope reported by the audit, not necessarily a current dataset count. `claim_id`, `source_id`: verdict evidence. `summary`: paraphrased issue categories. `remediation_status=not_checked`: later fixes have not been assessed.

## metric_snapshots

`snapshot_id`, `benchmark_id`, `metric`: a source-specific github_stars or github_forks observation. `value`: numeric interpretation. `value_display`: original displayed representation. `precision`: rounded or displayed_integer. `source_id`, `observed_on`: evidence and observation date. These are web-display observations, not API-certified exact counts; in particular 1.9k is not exactly 1,900.

## research_gaps

`gap_id`, `benchmark_id`: work item identity and subject. `priority`: P0 before publication, P1 follow-up. `gap_type`: editorial category of missing evidence. `status=open`: unresolved. `next_action`: concrete collection or reconciliation work. This table does not enumerate every empty field on all 35 profiles; registry_only entries still require the full research template.
