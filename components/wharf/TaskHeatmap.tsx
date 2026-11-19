"use client";

import { useState } from "react";
import type { TaskComparison } from "@/content/wharf-swe-tasks";

type Pairing = TaskComparison & { otherLabel: string };

const keyOf = (c: Pairing) => `${c.model}|${c.harness}`;
const total = (c: Pairing, side: "copilot" | "other") => c.tasks.reduce((sum, task) => sum + task[side], 0);

export function TaskHeatmap({ comparisons }: { comparisons: Pairing[] }) {
  // Open on the pairing with the widest overall gap, where the task-level differences show most.
  const widest = comparisons.reduce((a, b) =>
    Math.abs(total(b, "copilot") - total(b, "other")) > Math.abs(total(a, "copilot") - total(a, "other")) ? b : a,
  );
  const [selected, setSelected] = useState(keyOf(widest));
  const [sort, setSort] = useState("gap");
  const comparison = comparisons.find((entry) => keyOf(entry) === selected) ?? widest;
  const tasks = sort === "gap"
    ? [...comparison.tasks].sort((a, b) => Math.abs(b.copilot - b.other) - Math.abs(a.copilot - a.other))
    : comparison.tasks;
  const { attempts } = comparison;
  const totalAttempts = attempts * comparison.tasks.length;
  const columns = [
    { side: "copilot" as const, label: "Copilot", version: comparison.copilotVersion },
    { side: "other" as const, label: comparison.otherLabel, version: comparison.otherVersion },
  ];
  const selectClass = "border border-line bg-surface px-3 py-2 text-sm text-ink";

  return (
    <figure className="m-0 flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 font-mono text-xs text-muted">
          <span id="wharf-task-model">Model and harnesses</span>
          <select aria-labelledby="wharf-task-model" className={selectClass} value={selected} onChange={(event) => setSelected(event.target.value)}>
            {comparisons.map((entry) => (
              <option key={keyOf(entry)} value={keyOf(entry)}>
                {entry.model} · Copilot vs {entry.otherLabel}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-mono text-xs text-muted">
          <span id="wharf-task-sort">Sort tasks</span>
          <select aria-labelledby="wharf-task-sort" className={selectClass} value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="gap">Biggest gap first</option>
            <option value="release">Task release order</option>
          </select>
        </label>
      </div>

      <table className="w-full max-w-2xl border-separate border-spacing-0 text-sm">
        <caption className="sr-only">
          {comparison.model} verified passes by benchmark task on Copilot and {comparison.otherLabel}
        </caption>
        <thead>
          <tr className="text-left">
            <th scope="col" className="border-b border-line py-2 pr-2">Task</th>
            {columns.map((col) => (
              <th key={col.side} scope="col" className="w-1/4 border-b border-line px-1 py-2 text-center">
                {col.label} <span className="block font-mono text-xs font-normal text-muted">{col.version}</span>
                <span className="block pt-1 font-mono text-xs tabular-nums text-ink">
                  {total(comparison, col.side)}/{totalAttempts} passed
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <th scope="row" className="border-b border-line py-2 pr-2 text-left font-medium">{task.title}</th>
              {columns.map((col) => {
                const passes = task[col.side];
                const rival = task[col.side === "copilot" ? "other" : "copilot"];
                const wins = passes > rival;
                return (
                  <td key={col.side} className="border-b border-line px-1 py-1 text-center">
                    <span
                      className={`block rounded-sm py-1 font-mono font-semibold tabular-nums text-ink ${wins ? "ring-2 ring-inset ring-ink" : ""}`}
                      style={{ backgroundColor: `color-mix(in srgb, var(--color-series-3) ${(passes / attempts) * 65}%, var(--color-surface))` }}
                    >
                      {passes}/{attempts}
                      {wins && <span className="sr-only"> (more passes)</span>}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="font-mono text-xs text-muted">
        Verified passes out of {attempts} attempts per task. Darker cells indicate more passes; an
        outline marks the harness that passed more attempts on that task.
      </figcaption>
    </figure>
  );
}
