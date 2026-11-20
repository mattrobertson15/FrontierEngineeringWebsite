/**
 * Sync the site's Wharf figures from a local checkout of github.com/bartr/wharf.
 *
 *   git clone https://github.com/bartr/wharf /tmp/wharf   (or git pull an existing one)
 *   npm run wharf:sync -- /tmp/wharf
 *
 * DeepSWE: content/wharf-deepswe.json and wharf-deepswe-tasks.json are generated in full from the
 * per-attempt exports in deep-swe/data/*.jsonl, checked against deep-swe/data/manifest.json.
 * (docs/pass-at-1-vs-cost.csv is not used: it lags the exports and leaves out the HVE runs.)
 * Display names live in content/wharf-labels.ts; a model or agent missing there stops the sync.
 * WharfSWE: content/wharf-swe.json is generated in full from wharf-swe/data/manifest.json,
 * plus Codex API-equivalent estimates from the trial exports. Task outcomes are written separately.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deepSweHarnessNames, deepSweModelNames } from "../../content/wharf-labels.ts";
import { modelName, taskComparisons } from "../../content/wharf-swe-tasks.ts";

const repo = process.argv[2];
if (!repo) {
  console.error("usage: npm run wharf:sync -- <path to wharf checkout>");
  process.exit(1);
}

const git = (...args: string[]) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
const commit = git("rev-parse", "--short=7", "HEAD");
const commitDate = git("log", "-1", "--format=%cs");

/* ---------- DeepSWE: regenerate ---------- */

type DeepTrial = {
  arm: string;
  agent: string;
  agent_version: string;
  model: string;
  effort: string;
  job: string;
  task_id: string;
  reward: number | null;
  exception_type: string | null;
  cost_usd: number | null;
  agent_seconds: number | null;
  p2p_passed: number | null;
  p2p_total: number | null;
  n_input_tokens: number | null;
  language: string;
};
type DeepManifestArm = { arm: string; trials: number; tasks: number; with_cost: number };

const deepDir = join(repo, "deep-swe/data");
const deepManifest: DeepManifestArm[] = JSON.parse(readFileSync(join(deepDir, "manifest.json"), "utf8"));
const deepTaskCount = deepManifest[0]?.tasks ?? 0;
const passed = (t: DeepTrial) => (t.reward ?? 0) > 0;
const round = (x: number, places = 4) => Number(x.toFixed(places));
const meanIfCovered = (values: (number | null)[], planned: number) => {
  const known = values.filter((v): v is number => v != null && v > 0);
  return known.length >= 0.95 * planned ? Math.round(known.reduce((a, b) => a + b, 0) / known.length) : null;
};

const deepTasks: Record<string, Record<string, number>> = {};
const taskLanguages: Record<string, string> = {};
const deepArms = readdirSync(deepDir).filter((f) => f.endsWith(".jsonl")).sort().map((file) => {
  const id = file.slice(0, -".jsonl".length);
  const trials: DeepTrial[] = readFileSync(join(deepDir, file), "utf8").trim().split("\n")
    .map((line) => JSON.parse(line));
  const first = trials[0];
  const fail = (why: string) => { throw new Error(`DeepSWE ${id}: ${why}`); };
  if (trials.some((t) => t.arm !== id)) fail("trial rows name a different arm");
  if (!deepSweModelNames[first.model]) fail(`no display name for model "${first.model}" in content/wharf-labels.ts`);
  if (!deepSweHarnessNames[first.agent]) fail(`no display name for agent "${first.agent}" in content/wharf-labels.ts`);

  const byTask = new Map<string, DeepTrial[]>();
  for (const t of trials) byTask.set(t.task_id, [...(byTask.get(t.task_id) ?? []), t]);
  // Planned attempts = tasks x the most attempts any task got. Missing attempts stay in the
  // denominator as failures; a run never earns a smaller denominator by losing attempts.
  const k = Math.max(...[...byTask.values()].map((rows) => rows.length));
  const planned = deepTaskCount * k;
  const passing = trials.filter(passed).length;
  const costed = trials.filter((t) => t.cost_usd != null);

  const m = deepManifest.find((a) => a.arm === id);
  if (!m) fail("missing from manifest.json");
  if (m!.trials !== trials.length || m!.tasks !== byTask.size || m!.with_cost !== costed.length) {
    fail(`counts disagree with manifest.json (${trials.length} rows, ${byTask.size} tasks, ${costed.length} costed)`);
  }
  if (byTask.size !== deepTaskCount) fail(`covers ${byTask.size} of ${deepTaskCount} tasks`);

  // Task-clustered standard error of the pass rate: attempts on one task are correlated, so
  // the task, not the attempt, is the independent unit.
  const rate = passing / planned;
  const spread = [...byTask.values()].reduce((sum, rows) => sum + (rows.filter(passed).length - rate * k) ** 2, 0);
  const se = Math.sqrt((deepTaskCount / (deepTaskCount - 1)) * spread) / planned;

  const taskSeconds = [...byTask.values()].map((rows) => {
    const timed = rows.filter((t) => t.agent_seconds != null);
    return timed.reduce((sum, t) => sum + t.agent_seconds!, 0) / Math.max(1, timed.length);
  });
  for (const t of trials) taskLanguages[t.task_id] ??= t.language;
  deepTasks[id] = Object.fromEntries([...byTask].sort().map(([task, rows]) => [task, rows.filter(passed).length]));

  return {
    id,
    model: first.model,
    harness: first.agent,
    // The id carries the harness release; Claude Code's rows report several patch releases.
    version: id.match(/\d+\.\d+\.\d+/)?.[0] ?? first.agent_version,
    effort: first.effort,
    guidance: first.job.startsWith("hve-core") ? "hve-core" : null,
    attemptsPerTask: k,
    planned,
    retained: trials.length,
    passing,
    regressions: trials.filter((t) => t.p2p_total != null && t.p2p_passed != null && t.p2p_passed < t.p2p_total).length,
    errors: trials.filter((t) => t.exception_type).length,
    // An agent cut short by a timeout or cancellation is still graded on the patch it left.
    erroredPasses: trials.filter((t) => t.exception_type && passed(t)).length,
    costPerAttempt: costed.length ? round(costed.reduce((sum, t) => sum + t.cost_usd!, 0) / costed.length) : null,
    costCoverage: round(costed.length / planned),
    agentSeconds: Math.round(taskSeconds.reduce((a, b) => a + b, 0) / taskSeconds.length),
    se: round(se, 5),
    // Task-level consistency: solved on every planned attempt, or on none.
    tasksAllPass: [...byTask.values()].filter((rows) => rows.length === k && rows.every(passed)).length,
    tasksNoPass: [...byTask.values()].filter((rows) => !rows.some(passed)).length,
    // Mean input tokens per attempt; null unless nearly every attempt recorded them.
    inputTokens: meanIfCovered(trials.map((t) => t.n_input_tokens), planned),
  };
});

const deepOut = {
  source: "https://github.com/bartr/wharf/tree/main/deep-swe",
  commit,
  commitDate,
  taskCount: deepTaskCount,
  arms: deepArms,
};
writeFileSync(new URL("../../content/wharf-deepswe.json", import.meta.url), JSON.stringify(deepOut, null, 2) + "\n");
const sortedLanguages = Object.fromEntries(Object.entries(taskLanguages).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(
  new URL("../../content/wharf-deepswe-tasks.json", import.meta.url),
  JSON.stringify({ languages: sortedLanguages, passes: deepTasks }) + "\n",
);

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

type Trial = {
  task_id: string;
  task_checksum?: string;
  reward: number | null;
  estimated_cost_usd?: number | null;
};

function readTrials(arm: string): Trial[] {
  return readFileSync(join(dataDir, `${arm}.jsonl`), "utf8").trim().split("\n")
    .map((line) => JSON.parse(line) as Trial);
}

/** Mean API-equivalent estimate per trial; null unless every trial has one. */
function apiEstimate(trials: Trial[]): number | null {
  const values = trials.map((trial) => trial.estimated_cost_usd);
  if (values.some((value) => value == null)) return null;
  return Number((values.reduce<number>((sum, value) => sum + (value ?? 0), 0) / values.length).toFixed(4));
}

function taskResults(arm: ManifestArm, trials: Trial[]) {
  const groups = new Map<string, Trial[]>();
  for (const trial of trials) {
    const group = groups.get(trial.task_id) ?? [];
    group.push(trial);
    groups.set(trial.task_id, group);
  }
  const tasks = [...groups].map(([id, rows]) => {
    const checksum = rows[0].task_checksum;
    return {
      id,
      checksum: checksum && rows.every((row) => row.task_checksum === checksum) ? checksum : null,
      attempts: rows.length,
      passes: rows.filter((row) => (row.reward ?? 0) > 0).length,
    };
  });
  if (trials.length !== arm.trials || tasks.length !== arm.tasks ||
      tasks.reduce((sum, task) => sum + task.passes, 0) !== arm.passes) {
    throw new Error(`Trial outcomes do not match manifest for ${arm.arm}`);
  }
  return tasks;
}

const tasksByArm: Record<string, ReturnType<typeof taskResults>> = {};
const arms = manifest.map((m) => {
  const trials = readTrials(m.arm);
  tasksByArm[m.arm] = taskResults(m, trials);
  return {
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
    apiEstimatePerTrial: m.cli === "codex" ? apiEstimate(trials) : null,
    agentSeconds: m.average_agent_seconds,
  };
});

const out = {
  source: "https://github.com/bartr/wharf/tree/main/wharf-swe",
  commit,
  commitDate,
  taskCount: manifest[0]?.tasks ?? 0,
  arms,
};
const outPath = new URL("../../content/wharf-swe.json", import.meta.url);
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");

const taskPath = new URL("../../content/wharf-swe-task-results.json", import.meta.url);
writeFileSync(taskPath, JSON.stringify(tasksByArm, null, 2) + "\n");

console.log(`Wharf @ ${commit} (${commitDate})`);
console.log(`WharfSWE: wrote ${arms.length} arms to content/wharf-swe.json`);

// The "By task" heatmap leaves out any comparison it can't show fairly; say so here, not silently.
const { comparisons, problems } = taskComparisons(
  arms.map((a) => ({ ...a, model: modelName(a.model) })),
  tasksByArm,
);
console.log(`WharfSWE: ${comparisons.length} per-task harness comparison(s) for the heatmap`);
if (problems.length) {
  console.log(`WharfSWE: ${problems.length} comparison(s) left off the heatmap:`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exitCode = 2;
}
console.log(`DeepSWE: wrote ${deepArms.length} arms to content/wharf-deepswe.json`);
