# Benchmark research

The editorial source for the Benchmark Intelligence Directory. Everything here is reviewed in a
pull request, then loaded into Supabase by the importer. **Merging is publishing.** Nothing reaches
the database or the site without passing through review.

## Workflow

1. Branch, then add or edit files:
   - `benchmarks/<slug>.yaml`: one benchmark family. Start from `benchmarks/_TEMPLATE.yaml`.
   - `sources.yaml`: every document you cite, with a snapshot for each time you read it.
   - `organizations.yaml`, `models.yaml`, `capabilities.yaml`, `licenses.yaml`, `metrics.yaml`: reference data.
   - `runs/<experiment>.json`: Frontier evaluation runs (contract `frontier-run/v1`, see below).
2. `npm run registry:validate` checks every file and every cross-reference. It needs no database.
3. Open a PR. The reviewer checks each fact against its evidence locator.
4. After merge: `npm run registry:import -- --dry-run`, then `npm run registry:import`.
   A real import refuses to run if `research/` has uncommitted changes, and records the git commit.

## Rules

- **Every fact carries evidence.** Structured facts (`maintainer`, `released_on`, `task_count`) and
  free-form `claims` are `{ value, status, evidence[] }`. Each evidence entry names a source key,
  a locator (page, section or table) and optionally a short excerpt.
- **Unknown is `null`.** Never write 0, an empty string or a best guess for a value you don't have.
  Dates use the precision the source gives (`"2025"`, `"2025-03"`, `"2025-03-14"`).
- **Status means what it says.** Use `reported` when a publisher states something and `verified`
  only when we checked it independently. Confirming that a lab published a score does not verify
  the score. `estimated` values say how they were derived. `unverified` is for leads not yet checked.
- **Identity before detail.** Decide what an entry *is* before filling it in: benchmark, suite,
  framework, evaluation study or index; family or version. Do not assume similarly named projects
  share a family. Only record relationships that a source states.
- **Citations are experiments, not documents.** One lab reporting one model's score is one
  citation. The same result in a model card and a blog post is one citation with two evidence entries.
  Pick the right kind: `mention`, `explicit_adoption`, `score_report`, `reproduction`, `audit`,
  `frontier_run`.
- **Keep summaries editorial.** `summary` and `description` explain; they do not carry numbers.
  Put any number in a fact or claim so it has evidence.
- **Publishing requirements.** `review_state: published` needs a classified `kind`, a `summary`,
  `reviewed_on`, `last_verified_on`, and supporting evidence on every fact and claim. The validator
  and the database both enforce this.

## Database access

The registry lives in the dedicated Supabase project **Benchmarks** (`ckeokmyutzmsdcsogyxg`,
Frontier Engineering organization). Everything is in the `benchmarks` schema, so it could share a
database with unrelated data if it ever had to. Migrations are in `db/migrations/` and are tracked
in `benchmarks.schema_migrations`, never in Supabase's own migration history. Don't run
`supabase db push` with these files.

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
`benchmarks_site`. To move to a dedicated project later: `pg_dump --schema=benchmarks`, restore
into the new project, recreate the two login roles there, and swap the connection strings.

## What the database guarantees

- Idempotent imports: re-running the same commit changes nothing.
- History: every update or delete of editorial rows is copied to `row_history`. Review-state
  changes are logged in `review_events` with the commit. Claims removed from files are
  **retracted**, not deleted.
- Integrity: a published claim without supporting evidence fails the import. A split must belong
  to its run's version. Configurations and source snapshots are immutable. Duplicate citations of
  one experiment are rejected. The `unsupported_facts` view must stay empty.

## Frontier runs (`frontier-run/v1`)

One JSON file per experiment in `runs/`. The schema is `RunImportV1` in
`scripts/registry/contract.ts`. It covers:

- `experiment_id`: stable and immutable. Re-importing the same id must carry an identical payload;
  to correct a run, publish a new experiment id.
- `benchmark`: `{ family, version, split }`, which must exist in `benchmarks/`.
- `model` (slug and config), `agent`, `environment`: the exact configuration. These are stored by hash and never edited.
- `protocol`: repetitions, grader, protocol hash.
- `timestamps`, `status`: an `incomplete` run is not a failure.
- `outcomes[]`: metric id from `metrics.yaml`, original value and unit, optional normalized value, sample size, CI.
- `usage`: measured attempts, tool calls, retries, duration, API and infrastructure cost, cost
  coverage, and tokens by category. Omit what wasn't recorded; absent means unknown.
- `artifacts[]`: at least one log, config or results file, with its sha256.

`fixture: true` marks test data. The importer refuses fixtures outside the test suite.
