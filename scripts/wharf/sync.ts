/**
 * Sync the site's Wharf figures from a local checkout of github.com/bartr/wharf.
 *
 *   git clone https://github.com/bartr/wharf /tmp/wharf   (or git pull an existing one)
 *   npm run wharf:sync -- /tmp/wharf
 *
 * DeepSWE: content/wharf.ts is hand-curated (display names, run ids quoted by pages), so this
 * only checks it against docs/pass-at-1-vs-cost.csv and reports any drift to fix by hand.
 * WharfSWE: content/wharf-swe.json is generated in full from wharf-swe/data/manifest.json,
 * plus the Codex API-equivalent estimates from each Codex arm's JSONL.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runs as deepSweRuns } from "../../content/wharf.ts";

const repo = process.argv[2];
if (!repo) {
  console.error("usage: npm run wharf:sync -- <path to wharf checkout>");
  process.exit(1);
}

const git = (...args: string[]) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
const commit = git("rev-parse", "--short=7", "HEAD");
const commitDate = git("log", "-1", "--format=%cs");

/* ---------- DeepSWE: verify only ---------- */

const csv = readFileSync(join(repo, "docs/pass-at-1-vs-cost.csv"), "utf8").trim().split(/\r?\n/);
const header = csv[0].split(",");
const rows = csv.slice(1).map((line) => Object.fromEntries(line.split(",").map((v, i) => [header[i], v])));
const drift: string[] = [];
for (const row of rows) {
  const site = deepSweRuns.find((r) => r.id === row.arm);
  if (!site) {
    drift.push(`new arm not on site: ${row.arm}`);
    continue;
  }
  const cost = row.cost_per_costed_trial_usd ? Number(Number(row.cost_per_costed_trial_usd).toFixed(4)) : null;
  // The site measures coverage against planned attempts, which never shrink.
  const coverage = Number((Number(row.costed_trials) / Number(row.planned_trials)).toFixed(4));
  if (site.planned !== Number(row.planned_trials)) drift.push(`${row.arm}: planned ${site.planned} → ${row.planned_trials}`);
  if (site.passing !== Number(row.passing_trials)) drift.push(`${row.arm}: passing ${site.passing} → ${row.passing_trials}`);
  if (site.costPerAttempt !== cost) drift.push(`${row.arm}: cost ${site.costPerAttempt} → ${cost}`);
  if (site.costCoverage !== coverage) drift.push(`${row.arm}: coverage ${site.costCoverage} → ${coverage}`);
}
for (const r of deepSweRuns) {
  if (!rows.some((row) => row.arm === r.id)) drift.push(`site arm missing from CSV: ${r.id}`);
}

/* ---------- WharfSWE: regenerate ---------- */

type ManifestArm = {
  arm: string;
  cli: string;
  cli_version: string;
  effort: string;
  model: string;
  passes: number;
  p2p_errors: number;
  score: number | string;
  tasks: number;
  trials: number;
  cost_per_trial_usd: number | null;
  with_cost: number;
  average_agent_seconds: number;
};

const dataDir = join(repo, "wharf-swe/data");
const manifest: ManifestArm[] = JSON.parse(readFileSync(join(dataDir, "manifest.json"), "utf8"));

/** Mean API-equivalent estimate per trial; null unless every trial has one (no partial estimates). */
function apiEstimate(arm: string): number | null {
  const lines = readFileSync(join(dataDir, `${arm}.jsonl`), "utf8").trim().split("\n");
  const values = lines.map((l) => JSON.parse(l).estimated_cost_usd as number | null | undefined);
  if (values.some((v) => v == null)) return null;
  return Number(((values as number[]).reduce((a, b) => a + b, 0) / values.length).toFixed(4));
}

const arms = manifest.map((m) => ({
  id: m.arm,
  model: m.model,
  harness: m.cli,
  version: m.cli_version,
  effort: m.effort,
  passes: m.passes,
  trials: m.trials,
  p2pErrors: m.p2p_errors,
  score: Number(Number(m.score).toFixed(4)),
  costPerTrial: m.cost_per_trial_usd,
  costCoverage: m.trials ? Number((m.with_cost / m.trials).toFixed(4)) : 0,
  apiEstimatePerTrial: m.cli === "codex" ? apiEstimate(m.arm) : null,
  agentSeconds: m.average_agent_seconds,
}));

const out = {
  source: "https://github.com/bartr/wharf/tree/main/wharf-swe",
  commit,
  commitDate,
  taskCount: manifest[0]?.tasks ?? 0,
  arms,
};
const outPath = new URL("../../content/wharf-swe.json", import.meta.url);
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");

console.log(`Wharf @ ${commit} (${commitDate})`);
console.log(`WharfSWE: wrote ${arms.length} arms to content/wharf-swe.json`);
if (drift.length) {
  console.log(`DeepSWE: ${drift.length} difference(s) from content/wharf.ts — update it by hand:`);
  for (const d of drift) console.log(`  - ${d}`);
  process.exitCode = 2;
} else {
  console.log(`DeepSWE: all ${deepSweRuns.length} runs in content/wharf.ts match the CSV. Bump wharfCommit to ${commit}.`);
}
