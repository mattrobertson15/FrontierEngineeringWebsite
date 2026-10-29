/**
 * Wharf DeepSWE results — the single source for every benchmark figure on the site.
 *
 * Source: github.com/bartr/wharf, docs/pass-at-1-vs-cost.csv and the README results
 * table, commit 661b6e3 (Oct 28, 2026). Use these runs only; RESULTS.md reports
 * different runs and must not be mixed in. When Wharf publishes new results, update
 * this file and the commit above, then re-read every page that quotes a number.
 */

export const wharfSource = "https://github.com/bartr/wharf";
export const wharfCommit = "661b6e3";
export const wharfDate = "Oct 2026";
export const taskCount = 113;

export type WharfRun = {
  id: string;
  model: string;
  harness: string;
  /** Harness release the run used. */
  version: string;
  effort: string;
  /** Planned attempts; missing attempts count as failures, never shrink this. */
  planned: number;
  passing: number;
  /** Attempts with at least one pre-existing (P2P) test failing after the change. */
  regressions: number;
  /** Mean cost per attempt with cost data; null when no cost was recorded. */
  costPerAttempt: number | null;
  /** Share of attempts with cost data, 0–1. */
  costCoverage: number;
  /** Task-weighted mean agent time per attempt, seconds. */
  agentSeconds: number;
};

export const runs: WharfRun[] = [
  { id: "copilot-gpt-5.6-luna-max-1.0.77", model: "GPT-5.6 Luna", harness: "Copilot", version: "1.0.77", effort: "max", planned: 452, passing: 335, regressions: 17, costPerAttempt: 0.3711, costCoverage: 0.9712, agentSeconds: 1511 },
  { id: "copilot-gemini-3.8-flash-high-1.0.91", model: "Gemini 3.8 Flash", harness: "Copilot", version: "1.0.91", effort: "high", planned: 452, passing: 335, regressions: 20, costPerAttempt: 2.7897, costCoverage: 1, agentSeconds: 1879 },
  { id: "copilot-claude-opus-5-max-1.0.77", model: "Claude Opus 5", harness: "Copilot", version: "1.0.77", effort: "max", planned: 452, passing: 322, regressions: 20, costPerAttempt: 5.6623, costCoverage: 0.9867, agentSeconds: 2146 },
  { id: "copilot-gpt-6-astra-max-1.0.91", model: "GPT-6 Astra", harness: "Copilot", version: "1.0.91", effort: "max", planned: 452, passing: 321, regressions: 43, costPerAttempt: 8.4274, costCoverage: 0.9889, agentSeconds: 1619 },
  { id: "copilot-claude-opus-5.5-max-1.0.95", model: "Claude Opus 5.5", harness: "Copilot", version: "1.0.95", effort: "max", planned: 452, passing: 320, regressions: 22, costPerAttempt: 11.9774, costCoverage: 0.8208, agentSeconds: 3765 },
  { id: "copilot-hydrafusion-default-1.0.98", model: "HydraFusion (all-1)", harness: "Copilot", version: "1.0.98", effort: "default", planned: 452, passing: 318, regressions: 28, costPerAttempt: 1.2149, costCoverage: 0.9956, agentSeconds: 1069 },
  { id: "copilot-hydrafusion-max-1.0.95-all-2", model: "HydraFusion (all-2)", harness: "Copilot", version: "1.0.95", effort: "max", planned: 452, passing: 317, regressions: 32, costPerAttempt: 1.1726, costCoverage: 0.9889, agentSeconds: 1466 },
  { id: "copilot-gpt-5.6-luna-max-1.0.91", model: "GPT-5.6 Luna", harness: "Copilot", version: "1.0.91", effort: "max", planned: 452, passing: 316, regressions: 21, costPerAttempt: 0.367, costCoverage: 0.9889, agentSeconds: 1614 },
  { id: "copilot-gpt-5.6-sol-xhigh-1.0.77", model: "GPT-5.6 Sol", harness: "Copilot", version: "1.0.77", effort: "xhigh", planned: 452, passing: 315, regressions: 23, costPerAttempt: 8.4366, costCoverage: 0.9912, agentSeconds: 1823 },
  { id: "copilot-hydrafusion-max-1.0.95", model: "HydraFusion (all-1)", harness: "Copilot", version: "1.0.95", effort: "max", planned: 452, passing: 311, regressions: 36, costPerAttempt: 1.2074, costCoverage: 0.9889, agentSeconds: 1424 },
  { id: "copilot-claude-opus-5.5-max-1.0.91", model: "Claude Opus 5.5", harness: "Copilot", version: "1.0.91", effort: "max", planned: 452, passing: 309, regressions: 27, costPerAttempt: 11.4134, costCoverage: 0.8673, agentSeconds: 3452 },
  { id: "copilot-gpt-5.6-terra-max-1.0.77", model: "GPT-5.6 Terra", harness: "Copilot", version: "1.0.77", effort: "max", planned: 565, passing: 376, regressions: 37, costPerAttempt: 4.2576, costCoverage: 0.9752, agentSeconds: 1677 },
  { id: "cc-claude-opus-5-max-2.1.220", model: "Claude Opus 5", harness: "Claude Code", version: "2.1.220", effort: "max", planned: 452, passing: 291, regressions: 21, costPerAttempt: 13.4885, costCoverage: 0.9934, agentSeconds: 1873 },
  { id: "copilot-gpt-6-luna-max-1.0.91", model: "GPT-6 Luna", harness: "Copilot", version: "1.0.91", effort: "max", planned: 452, passing: 276, regressions: 36, costPerAttempt: 0.1759, costCoverage: 1, agentSeconds: 1417 },
  { id: "muse-spark-1.2-contributor-xhigh-0.1.0", model: "Muse Spark 1.2", harness: "Muse Code", version: "0.1.0", effort: "xhigh", planned: 565, passing: 338, regressions: 44, costPerAttempt: null, costCoverage: 0, agentSeconds: 1185 },
  { id: "copilot-auto-max-1.0.77", model: "Auto", harness: "Copilot", version: "1.0.77", effort: "max", planned: 565, passing: 209, regressions: 48, costPerAttempt: 1.6234, costCoverage: 0.9522, agentSeconds: 1308 },
];

export const passRate = (r: WharfRun) => r.passing / r.planned;

export const run = (id: string) => {
  const found = runs.find((r) => r.id === id);
  if (!found) throw new Error(`Unknown Wharf run: ${id}`);
  return found;
};

export const totalPlanned = runs.reduce((sum, r) => sum + r.planned, 0);

export const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
export const usd = (x: number | null) => (x === null ? "—" : `$${x.toFixed(2)}`);
