/**
 * WharfSWE task list, model display names, and the per-task harness comparisons behind the
 * "By task" heatmap. Kept free of imports so scripts/wharf/sync.ts can load it under plain
 * Node and report any comparison the page would have to drop.
 */

const modelNames: Record<string, string> = {
  "claude-opus-5": "Claude Opus 5",
  "claude-opus-5.5": "Claude Opus 5.5",
  "claude-opus-5-5": "Claude Opus 5.5",
  "gemini-3.8-flash": "Gemini 3.8 Flash",
  "gpt-5.6-luna": "GPT-5.6 Luna",
  "gpt-5.6-terra": "GPT-5.6 Terra",
  "gpt-6-astra": "GPT-6 Astra",
  "gpt-6-luna": "GPT-6 Luna",
  "gpt-6.1-sol": "GPT-6.1 Sol",
  hydrafusion: "HydraFusion",
  "mai-code-1.1-flash": "MAI Code 1.1 Flash",
};

/** Display name for a manifest model; Claude Code's "claude-opus-5-5" and Copilot's "claude-opus-5.5" share one. */
export const modelName = (raw: string) => modelNames[raw] ?? raw;

/**
 * The task set, in release order. Each task starts from the Wharf source at `from` and asks
 * the agent to build the next release's feature against its exact public API. Graded by 3–4
 * new contract tests plus one pre-existing test that must keep passing.
 * Source: wharf-swe/tasks/<id>/task.toml and instruction.md at the commit in wharf-swe.json.
 */
export const sweTasks = [
  { id: "wharf-image-pull", from: "0.5", title: "Image pull rate limits" },
  { id: "wharf-derived-image", from: "0.6", title: "Derived image builds" },
  { id: "wharf-copilot", from: "0.7", title: "Copilot adapter & secrets" },
  { id: "wharf-agent", from: "0.8", title: "Isolated agent execution" },
  { id: "wharf-verifier", from: "0.9", title: "Pristine verifier" },
  { id: "wharf-scheduler", from: "0.10", title: "Deterministic scheduling" },
  { id: "wharf-execution", from: "0.11", title: "Execution policies & retries" },
  { id: "wharf-recovery", from: "0.12", title: "Interruption recovery" },
  { id: "wharf-operations", from: "0.13", title: "Run operations & notifications" },
  { id: "wharf-audit", from: "0.14", title: "Audit scoring" },
  { id: "wharf-reporting", from: "0.15", title: "Report rendering" },
  { id: "wharf-smoke", from: "0.16", title: "Local smoke workflow" },
  { id: "wharf-packaging", from: "0.17", title: "Packaging & rollback" },
  { id: "wharf-host-profile", from: "0.18", title: "Host profile qualification" },
] as const;

/** One run's outcome on one task, as written by the sync to wharf-swe-task-results.json. */
export type TaskOutcome = { id: string; checksum: string | null; attempts: number; passes: number };

type Run = { id: string; model: string; harness: string; version: string };

/** A model's newest Copilot run against its newest run on another harness, task by task. */
export type TaskComparison = {
  model: string;
  harness: string;
  copilotVersion: string;
  otherVersion: string;
  /** Attempts per task on each side; every task in a comparison has the same count. */
  attempts: number;
  tasks: { id: string; title: string; copilot: number; other: number }[];
};

const compareVersions = (a: string, b: string) => {
  const [pa, pb] = [a, b].map((v) => v.split(".").map(Number));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
};

/**
 * Builds every Copilot-vs-other-harness comparison that can be shown fairly: both runs must
 * cover every task, on identical task versions (checksums), with the same attempt count.
 * Anything that fails is left out and described in `problems`.
 */
export function taskComparisons(
  runs: Run[],
  outcomes: Record<string, TaskOutcome[]>,
  tasks: readonly { id: string; title: string }[] = sweTasks,
) {
  const comparisons: TaskComparison[] = [];
  const problems: string[] = [];
  const newest = (model: string, harness: string) =>
    runs
      .filter((r) => r.model === model && r.harness === harness)
      .reduce<Run | undefined>((a, b) => (!a || compareVersions(b.version, a.version) > 0 ? b : a), undefined);

  for (const model of new Set(runs.map((r) => r.model))) {
    const copilot = newest(model, "copilot-cli");
    if (!copilot) continue;
    const others = new Set(runs.filter((r) => r.model === model && r.harness !== "copilot-cli").map((r) => r.harness));
    for (const harness of others) {
      const other = newest(model, harness)!;
      const label = `${model}: Copilot ${copilot.version} vs ${harness} ${other.version}`;
      const issues: string[] = [];
      const attempts = new Set<number>();
      const rows: TaskComparison["tasks"] = [];

      for (const task of tasks) {
        const a = outcomes[copilot.id]?.find((o) => o.id === task.id);
        const b = outcomes[other.id]?.find((o) => o.id === task.id);
        if (!a || !b) {
          issues.push(`${task.id} has no outcome for ${!a ? copilot.id : other.id}`);
        } else if (!a.checksum || a.checksum !== b.checksum) {
          issues.push(`${task.id} ran on different task versions`);
        } else {
          attempts.add(a.attempts).add(b.attempts);
          rows.push({ id: task.id, title: task.title, copilot: a.passes, other: b.passes });
        }
      }
      for (const id of [copilot.id, other.id]) {
        for (const o of outcomes[id] ?? []) {
          if (!tasks.some((t) => t.id === o.id)) issues.push(`${id} has unlisted task ${o.id}; add it to sweTasks`);
        }
      }
      if (attempts.size > 1) issues.push(`attempt counts differ (${[...attempts].join(", ")})`);

      if (issues.length) problems.push(`${label} — ${issues.join("; ")}`);
      else comparisons.push({ model, harness, copilotVersion: copilot.version, otherVersion: other.version, attempts: [...attempts][0], tasks: rows });
    }
  }
  return { comparisons, problems };
}
