"use client";

import { useState } from "react";

export type TaskComparison = {
  model: string;
  copilotVersion: string;
  codexVersion: string;
  tasks: { id: string; title: string; attempts: number; copilot: number; codex: number }[];
};

export function TaskHeatmap({ comparisons }: { comparisons: TaskComparison[] }) {
  const [model, setModel] = useState(comparisons[0].model);
  const [sort, setSort] = useState("gap");
  const comparison = comparisons.find((entry) => entry.model === model) ?? comparisons[0];
  const tasks = sort === "gap"
    ? [...comparison.tasks].sort((a, b) => Math.abs(b.copilot - b.codex) - Math.abs(a.copilot - a.codex))
    : comparison.tasks;
  const selectClass = "border border-line bg-surface px-3 py-2 text-sm text-ink";

  return (
    <figure className="m-0 flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 font-mono text-xs text-muted">
          <span id="wharf-task-model">Model</span>
          <select aria-labelledby="wharf-task-model" className={selectClass} value={model} onChange={(event) => setModel(event.target.value)}>
            {comparisons.map((entry) => <option key={entry.model}>{entry.model}</option>)}
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
        <caption className="sr-only">{model} verified passes by benchmark task and harness</caption>
        <thead>
          <tr className="text-left">
            <th scope="col" className="border-b border-line py-2 pr-2">Task</th>
            <th scope="col" className="w-1/4 border-b border-line px-1 py-2 text-center">
              Copilot <span className="block font-mono text-xs font-normal text-muted">{comparison.copilotVersion}</span>
            </th>
            <th scope="col" className="w-1/4 border-b border-line px-1 py-2 text-center">
              Codex <span className="block font-mono text-xs font-normal text-muted">{comparison.codexVersion}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <th scope="row" className="border-b border-line py-2 pr-2 text-left font-medium">{task.title}</th>
              {[task.copilot, task.codex].map((passes, index) => (
                <td key={index} className="border-b border-line px-1 py-1 text-center">
                  <span
                    className="block rounded-sm py-1 font-mono font-semibold tabular-nums text-ink"
                    style={{ backgroundColor: `color-mix(in srgb, var(--color-series-3) ${(passes / task.attempts) * 42}%, var(--color-surface))` }}
                  >
                    {passes}/{task.attempts}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="font-mono text-xs text-muted">
        Verified passes out of four attempts per task. Darker cells indicate more passes.
      </figcaption>
    </figure>
  );
}
