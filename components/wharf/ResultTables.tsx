"use client";

import { useMemo, useState } from "react";
import { passRate, pct, runs, usd, type WharfRun } from "@/content/wharf";
import { harnessLabel, revision, sweRate, type HarnessKey, type SweRun } from "@/content/wharf-swe";
import { SortableTable, type Column } from "./SortableTable";

const usd4 = (x: number) => `$${x.toFixed(x < 0.1 ? 4 : 2)}`;

/* ---------- DeepSWE ---------- */

const deepColumns: Column<WharfRun>[] = [
  { key: "model", label: "model", sort: (r) => r.model, render: (r) => r.model, emphasis: true },
  { key: "harness", label: "harness", sort: (r) => r.harness, render: (r) => `${r.harness} ${r.version}` },
  { key: "effort", label: "effort", render: (r) => r.effort },
  {
    key: "passed",
    label: "passed",
    align: "right",
    sort: (r) => r.passing,
    firstDir: "desc",
    render: (r) => `${r.passing}/${r.planned}`,
  },
  {
    key: "rate",
    label: "pass@1",
    align: "right",
    sort: passRate,
    firstDir: "desc",
    render: (r) => pct(passRate(r)),
    bar: passRate,
    emphasis: true,
  },
  {
    key: "broke",
    label: "broke tests",
    align: "right",
    sort: (r) => r.regressions / r.planned,
    render: (r) => String(r.regressions),
    // Scaled to a 10% ceiling — the worst run (GPT-6 Astra) is 9.5%; the count is the value.
    bar: (r) => r.regressions / r.planned / 0.1,
    barClass: "bg-warn-soft",
  },
  { key: "cost", label: "$/attempt", align: "right", sort: (r) => r.costPerAttempt, render: (r) => usd(r.costPerAttempt) },
  {
    key: "time",
    label: "agent time",
    align: "right",
    sort: (r) => r.agentSeconds,
    render: (r) => `${Math.round(r.agentSeconds / 60)} min`,
  },
];

export function DeepSweTable() {
  return (
    <SortableTable
      rows={runs}
      columns={deepColumns}
      initial={(a, b) => passRate(b) - passRate(a)}
      caption="DeepSWE results for every configuration. Select a column header to sort."
    />
  );
}

/* ---------- WharfSWE ---------- */

const sweColumns: Column<SweRun>[] = [
  { key: "model", label: "model", sort: (r) => r.model, render: (r) => r.model, emphasis: true },
  {
    key: "harness",
    label: "harness",
    // Sort Copilot releases numerically, not as strings (1.0.95 before 1.0.114).
    sort: (r) => `${harnessLabel[r.harness]} ${String(revision(r)).padStart(4, "0")}`,
    render: (r) => `${harnessLabel[r.harness]} ${r.version}`,
  },
  {
    key: "passed",
    label: "passed",
    align: "right",
    sort: (r) => r.passes,
    firstDir: "desc",
    render: (r) => `${r.passes}/${r.trials}`,
  },
  {
    key: "rate",
    label: "pass@1",
    align: "right",
    sort: sweRate,
    firstDir: "desc",
    render: (r) => pct(sweRate(r)),
    bar: sweRate,
    emphasis: true,
  },
  {
    key: "broke",
    label: "broke tests",
    align: "right",
    sort: (r) => r.p2pErrors,
    render: (r) => String(r.p2pErrors),
    // Scaled to the worst run (11 of 56); the count is the value.
    bar: (r) => r.p2pErrors / 12,
    barClass: "bg-warn-soft",
  },
  {
    key: "cost",
    label: "$/trial",
    align: "right",
    sort: (r) => r.costPerTrial ?? r.apiEstimatePerTrial,
    render: (r) =>
      r.costPerTrial !== null ? (
        usd4(r.costPerTrial)
      ) : r.apiEstimatePerTrial !== null ? (
        <span title="API-price estimate; Codex retains no billed cost" className="text-muted">
          ~{usd4(r.apiEstimatePerTrial)}*
        </span>
      ) : (
        "—"
      ),
  },
  {
    key: "time",
    label: "agent time",
    align: "right",
    sort: (r) => r.agentSeconds,
    render: (r) => `${Math.round(r.agentSeconds)} s`,
  },
];

// Wharf's own order: pass rate, then fewer regressions, then cheaper (unknown last).
const sweOrder = (a: SweRun, b: SweRun) =>
  b.passes / b.trials - a.passes / a.trials ||
  a.p2pErrors - b.p2pErrors ||
  (a.costPerTrial ?? Infinity) - (b.costPerTrial ?? Infinity);

const chip = (on: boolean) =>
  `min-h-9 border px-3 font-mono text-xs transition-colors ${
    on ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink-2 hover:border-ink"
  }`;

export function SweTable({ runs }: { runs: SweRun[] }) {
  const [harness, setHarness] = useState<HarnessKey | "all">("all");
  const [model, setModel] = useState("all");
  const models = useMemo(() => [...new Set(runs.map((r) => r.model))].sort(), [runs]);
  const shown = runs.filter((r) => (harness === "all" || r.harness === harness) && (model === "all" || r.model === model));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter runs">
        {(["all", "copilot-cli", "claude", "codex"] as const).map((h) => (
          <button key={h} type="button" aria-pressed={harness === h} onClick={() => setHarness(h)} className={chip(harness === h)}>
            {h === "all" ? "All harnesses" : harnessLabel[h]}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 font-mono text-xs text-muted">
          model
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="min-h-9 border border-line bg-surface px-2 font-mono text-xs text-ink"
          >
            <option value="all">All models</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="m-0 font-mono text-xs text-muted" aria-live="polite">
        {shown.length} of {runs.length} runs
      </p>
      {shown.length ? (
        <SortableTable
          rows={shown}
          columns={sweColumns}
          initial={sweOrder}
          caption="WharfSWE results for every run. Select a column header to sort."
        />
      ) : (
        <p className="m-0 border border-line bg-surface p-6 text-ink-2">No runs match both filters.</p>
      )}
    </div>
  );
}
