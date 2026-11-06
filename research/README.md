# Benchmark research

The editorial master for the Benchmark Intelligence Directory: a relational CSV package, one file
per table, with stable text IDs. Changes are reviewed in a pull request, then loaded into Supabase
by the importer. **Merging is publishing.** Nothing reaches the database or the site without
passing review.

- `DATA_DICTIONARY.md` explains every table and field.
- `manifest.json` lists columns, types, keys and foreign keys. It is generated; never edit it by hand.
- `BATCH_0.1_NOTES.md` holds the findings and limitations of the first research batch (6 Nov 2026).
- `PILOT_PROFILES.md` has the DeepSWE and Terminal-Bench research drafts.
- `runs/<experiment>.json` holds Frontier evaluation runs (contract `frontier-run/v1`, see below).

## Workflow

1. Branch, then edit the CSVs. Keep IDs stable: never renumber rows or reuse an ID for a different
   thing. For new research, add rows with new IDs. Don't overwrite earlier observations.
2. `npm run registry:manifest` regenerates `manifest.json` after adding rows or tables.
3. `npm run registry:validate` checks every cell, key, reference and rule below. It needs no database.
4. Open a PR. The reviewer checks each new claim against its evidence locator.
5. After merge: `npm run registry:import -- --dry-run`, then `npm run registry:import`. A real import
   refuses to run if `research/` has uncommitted changes, and records the git commit.

## File conventions

- UTF-8, RFC-4180 CSV, header row. Non-empty values are quoted. **An empty cell is NULL**: unknown,
  never zero. A real 0 is written `"0"`.
- Dates are ISO `YYYY-MM-DD`. Never add a time of day that wasn't captured. Citation dates may be
  `YYYY` or `YYYY-MM` when that's all the source gives.
- Column order is part of the contract (`scripts/registry/contract.ts`). Adding a column means
  changing the contract, the migration and the dictionary together.

## Rules the validator enforces

- **Every claim has supporting evidence.** Each claim needs at least one `claim_evidence` row with
  `evidence_role = supports`. A `quotation` needs its excerpt.
- **Facts carried on rows need a source.** A version's `release_date` and `task_count`, a split's
  `task_count`, and every relationship need a `source_id`. The importer turns them into claims
  backed by that source, and a version's `task_count` must agree with any explicit `task_count` claim.
- **Versions stay with their benchmark.** A claim, audit, citation or observation that names a
  version must name that version's benchmark.
- **Conflicts stay visible.** Two claims may disagree, as with APEX-Agents' 240 vs 480 tasks. Neither
  becomes canonical until the conflict is resolved.
- **Attribution, not judgement.** Audits keep the auditor's own verdict and scope. Status `reported`
  means a source says so; `verified` means we checked it independently.
- **Staging stays staging.** `result_observations` are never ranked or turned into evaluation runs
  while `comparison_status = not_ready`.
- **Names resolve once.** Names and aliases are unique, case-insensitively, across all entries.
- **Publishing** (`review_state = published`) requires a classified `entity_kind`, a `summary`,
  `checked_on`, `reviewed_on`, `identity_status = primary_source_located`, and no open P0 research
  gaps. A `maintenance_status` needs a sourced maintenance claim.

## What the database guarantees

- Imports are idempotent. Rows match on their research IDs, so re-running the same commit changes
  nothing, and a slug can change without losing history.
- History is kept. Every update or delete is copied to `row_history`. Review-state changes are logged
  in `review_events` with the commit. Claims removed from the files are **retracted**, not deleted.
- Integrity is enforced. A published claim without supporting evidence fails the import. Source
  snapshots and run configurations are immutable; a new capture is a new snapshot. Duplicate
  citations of one experiment are rejected. The `unsupported_facts` view must stay empty.

## Database access

The registry lives in the dedicated Supabase project **Benchmarks** (`ckeokmyutzmsdcsogyxg`,
Frontier Engineering organization), in the `benchmarks` schema. Migrations are in `db/migrations/`
and are tracked in `benchmarks.schema_migrations`, never in Supabase's own migration history. Don't
run `supabase db push` with these files.

One-time setup per database (admin, in the Supabase SQL editor or psql):

1. `BENCHMARKS_MIGRATION_URL=<admin connection> npm run registry:migrate` creates the schema, the
   tables, and the `benchmarks_writer` / `benchmarks_reader` group roles.
2. Create the login roles. Passwords go in a password manager, never in git:
   ```sql
   create role benchmarks_importer login password '…' in role benchmarks_writer;
   create role benchmarks_site     login password '…' in role benchmarks_reader;
   ```
3. Set `BENCHMARKS_DATABASE_URL` to the importer role's connection string. On Supabase use the
   session pooler, with user `benchmarks_importer.<project-ref>`.
4. `npm run registry:check-access` must report that the role reaches nothing outside `benchmarks`.
   `registry:import` runs the same check and refuses to start if it fails, or if you connect as an admin.

Do not add `benchmarks` to Supabase's exposed API schemas. The site reads it on the server as
`benchmarks_site`.

## Frontier runs (`frontier-run/v1`)

One JSON file per experiment in `runs/`. The schema is `RunImportV1` in
`scripts/registry/contract.ts`. JSON is used because configurations are nested. A run includes:

- `experiment_id`: stable and immutable. Re-importing must carry an identical payload; to correct a
  run, publish a new ID.
- `benchmark`: `{ benchmark_id, version_id, split_id }`, which are research IDs from the CSVs.
- `model` (`model_id` and config), `agent`, `environment`: the exact configuration, stored by hash
  and never edited.
- `protocol`, `timestamps`, `status`: an `incomplete` run is not a failure.
- `outcomes[]`: metric ID from `metric_definitions.csv`, original value and unit, optional
  normalized value, sample size and CI.
- `usage`: measured attempts, tool calls, retries, duration, costs, cost coverage, and tokens by
  category. Omit what wasn't recorded; absent means unknown.
- `artifacts[]`: at least one log, config or results file, with its sha256.

`fixture: true` marks test data. The importer refuses fixtures outside the test suite.
