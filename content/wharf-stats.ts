import tasks from "./wharf-deepswe-tasks.json";
import { run, taskCount } from "./wharf";

/*
 * Paired comparisons between two DeepSWE runs, task by task. Import this only from Server
 * Components, so the per-task table stays out of client bundles.
 */

const passesByRun: Record<string, Record<string, number>> = tasks;

/**
 * Difference in pass rate (b − a) with a 95% range, in percentage points. Each task's pass rate is
 * compared across the two runs, so a task that's hard for both cancels out — a tighter test than
 * comparing the two overall rates.
 */
export function pairedDiff(aId: string, bId: string) {
  const [a, b] = [run(aId), run(bId)];
  const ids = Object.keys(passesByRun[a.id]);
  if (ids.length !== taskCount) throw new Error(`Per-task data incomplete for ${a.id}`);
  const diffs = ids.map((t) => (passesByRun[b.id][t] ?? 0) / b.attemptsPerTask - passesByRun[a.id][t] / a.attemptsPerTask);
  const mean = diffs.reduce((s, d) => s + d, 0) / diffs.length;
  const sd = Math.sqrt(diffs.reduce((s, d) => s + (d - mean) ** 2, 0) / (diffs.length - 1));
  const half = (1.96 * sd) / Math.sqrt(diffs.length);
  return { diff: mean * 100, lo: (mean - half) * 100, hi: (mean + half) * 100 };
}

/** Signed percentage points with a true minus sign: "+6.9", "−4.9". */
export const signed = (x: number) => `${x >= 0 ? "+" : "−"}${Math.abs(x).toFixed(1)}`;
