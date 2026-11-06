# Frontier Engineering benchmark research — batch 0.1

Research date: 2026-11-06. Status: **research staging, not a publication-ready database**.

## What is included

- 35 source-linked shortlist entries plus one supporting SWE-bench family record: **36 registry rows**, not 36 independent benchmark families.
- 12 launch priorities identified, including two pilot research drafts.
- 41 source records, 56 sourced claims and 56 evidence links.
- Four version records, three parent/variant relationships, two attributed audit records.
- Three sampled publisher-reported DeepSWE leaderboard observations. These are rounded display values, not reconstructed evaluation runs.
- Four dated repository metric observations and 16 specific research gaps.

Primary-source identity checks are complete for this batch at the level described by each source locator. Methodology, licenses, exact revisions, model configurations and all adoption claims are not fully validated. No Frontier Engineering evaluations were executed. No verified frontier-lab adoption events have been imported yet.

## Is CSV the right format?

**Yes for a portable research handoff and database import.** Use one file per entity or relationship, with stable IDs. CSV does not enforce types, references or version history, so keep the accompanying manifest and import rules. Once the site database exists, make it the source of truth and export CSV for review rather than independently editing two masters.

Use JSON/JSONL later for nested model configurations, raw adapter payloads and trajectories. Keep long research narratives in Markdown and immutable evidence snapshots in file/object storage. Do not place arrays, multiple URLs, or comma-separated lists into relational CSV columns.

## Files and row meaning

| File | One row represents |
| --- | --- |
| `benchmarks.csv` | A named registry entity: benchmark, variant, family, framework or evaluation study |
| `versions.csv` | An explicitly identified version of one registry entity |
| `sources.csv` | A retrieved source document or page, with a date and evidence locator |
| `claims.csv` | A single attributed statement about an entity or version |
| `claim_evidence.csv` | One source supporting one claim; allows multiple sources per claim |
| `relationships.csv` | A documented relationship between two registry entities |
| `result_observations.csv` | A sampled leaderboard card awaiting configuration reconciliation |
| `audits.csv` | An auditor's finding for a specific version |
| `metric_snapshots.csv` | A dated, source-specific popularity observation |
| `research_gaps.csv` | One unresolved research action |
| `manifest.json` | File counts, column types/nullability and foreign-key mappings |
| `DATA_DICTIONARY.md` | Field semantics and controlled values |
| `PILOT_PROFILES.md` | DeepSWE and Terminal-Bench research drafts |

## Import contract

1. Read UTF-8 RFC-4180 CSV with a header row and standard double-quote escaping. Unquoted empty cells mean SQL `NULL`. Zero is a real value. Preserve Unicode names such as τ-bench.
2. Import into staging in this order: sources → benchmarks → versions → claims → claim_evidence → relationships → result_observations → audits → metric_snapshots → research_gaps. Load self-referencing entities before relationships.
3. IDs are stable text keys. Do not renumber rows or derive joins from display names. Use the first column as the primary key and apply the foreign keys in `manifest.json`.
4. Parse `*_on` and `*_date` as ISO dates, never infer time-of-day. Parse numeric fields as numeric types. `claims.value` is deliberately text: cast according to `value_type` after checking the predicate/unit.
5. Reject duplicate IDs, missing required fields, unknown foreign keys, and a version that belongs to a different benchmark than its claim/result/audit.
6. Preserve the original package as an immutable import batch. Reimporting this same batch should upsert by stable ID without duplicating records. For subsequent research, append changed observations/evidence with new IDs and a batch identifier; do not overwrite prior snapshots.
7. Promote reviewed records into the full production schema from the kickoff brief. Create organizations, model/configuration records, agent configurations, splits and run records only when their identities are known.
8. For SWE-bench, retain one parent family and map Verified/Multilingual/Multimodal to explicit variants or version branches. Do not count a variant as an independent family or map all three to a shared score series. SWE-Bench Pro remains a separate project.
9. Keep `result_observations` in staging until exact configuration, protocol, metric and denominator are established. Do not manufacture `evaluation_runs` from the three cards. They are a deliberately small sample, not an exhaustive results import.

## Important findings

- **APEX-Agents:** its [official page](https://www.mercor.com/apex/apex-agents-leaderboard/) reports 240 tasks; its [linked paper](https://arxiv.org/abs/2601.14242) describes n=480. Both statements are retained with separate evidence. A canonical task count remains unset pending scope/revision reconciliation.
- **BrowserGym:** the [repository](https://github.com/ServiceNow/BrowserGym) describes an environment. It is useful related tooling and should not inflate benchmark-only totals.
- **METR Time Horizons:** the [source page](https://metr.org/time-horizons/) explicitly says it is no longer actively updated. Its last-update notice must remain visible.
- **DeepSWE and Terminal-Bench:** version-specific [DeepSWE](https://epoch.ai/benchmarks/deepswe/review) and [Terminal-Bench](https://epoch.ai/benchmarks/terminal-bench-4/review) audits are recorded as the auditor's findings, not as Frontier-verified defects or timeless judgments about all releases.

## Evidence limitations

Sources were read through web text retrieval on the research date. `snapshot_path` and `content_hash` are empty because immutable original-page captures have not been made. Do not claim these are archived evidence snapshots. Publication dates are blank where not established; retrieval dates are not publication dates. GitHub values reflect the displayed web page, not a direct API collection; rounded star labels remain marked rounded.

All source-derived claims are `reported`. This means the cited source asserts the fact; it does not imply independent reproduction. Registry `primary_source_located` means the identity has supporting primary evidence, not that its complete profile is approved.

## Next research batch

1. Capture immutable source snapshots and pin dataset/harness revisions for the 12 launch entries.
2. Resolve the APEX count difference and the OSWorld, SWE-Bench Pro and τ-bench version mappings.
3. Reconcile the DeepSWE sample against exact run artifacts; retrieve Terminal-Bench's dynamic result rows and task manifest.
4. Check audit remediation and locate original lab/model-release adoption documents.
5. Add exact GitHub API counts, then expand to 100–150 registry entries and finish the other 10 detailed profiles.

Validation performed: CSV round-trip parsing, expected row counts, unique primary keys, foreign-key integrity, version-to-benchmark consistency, claim evidence coverage, and exactly 12 launch priorities / 35 shortlist entries. Blank values and rounded figures are preserved. This validates the package structure, not the benchmark claims themselves.
