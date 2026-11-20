"use client";

import { useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { passRate, pct, range95, runNotes, runs, usd, type WharfRun } from "@/content/wharf";
import { harnessLabel, revision, sweRate, type HarnessKey, type SweRun } from "@/content/wharf-swe";
import { SortableTable, type Column } from "./SortableTable";

const usd4 = (x: number) => `$${x.toFixed(x < 0.1 ? 4 : 2)}`;

/* ---------- Preview wrapper ---------- */

/**
 * A sortable table that opens as a preview of its first rows under the current sort, with a
 * button to show the rest. No button when everything already fits.
 */
function PreviewTable<T extends { id: string }>({
  rows,
  columns,
  initial,
  caption,
  preview,
  noun,
}: {
  rows: T[];
  columns: Column<T>[];
  initial: (a: T, b: T) => number;
  caption: string;
  preview: number;
  /** Plural label for the button, e.g. "configurations". */
  noun: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const clipped = rows.length > preview;

  const toggle = () => {
    setExpanded((cur) => !cur);
    // Collapsing from the bottom of a long table would strand the reader below it.
    if (expanded) requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  return (
    <div ref={ref} className="scroll-mt-24">
      <SortableTable
        rows={rows}
        columns={columns}
        initial={initial}
        limit={expanded || !clipped ? undefined : preview}
        caption={`${caption}${clipped && !expanded ? ` Showing the first ${preview} of ${rows.length}.` : ""}`}
      />
      {clipped && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={toggle}
          className="flex min-h-11 w-full items-center justify-center gap-2 border border-t-0 border-line bg-surface font-mono text-xs text-ink-2 transition-colors hover:bg-paper hover:text-ink"
        >
          {expanded ? `Show first ${preview} only` : `Show all ${rows.length} ${noun}`}
          <span aria-hidden className={`inline-block transition-transform ${expanded ? "rotate-180" : ""}`}>↓</span>
        </button>
      )}
    </div>
  );
}

/* ---------- DeepSWE ---------- */

const byPassRate = (a: WharfRun, b: WharfRun) => passRate(b) - passRate(a);

// Footnotes are numbered once, in the default (pass-rate) order, so a row keeps its numbers
// when the table is re-sorted. Identical caveats share a number.
const noteText = [...new Set([...runs].sort(byPassRate).flatMap(runNotes))];
const noteNumbers = (r: WharfRun) => runNotes(r).map((n) => noteText.indexOf(n) + 1);

const deepColumns: Column<WharfRun>[] = [
  {
    key: "model",
    label: "model",
    sort: (r) => r.model,
    render: (r) => {
      const refs = noteNumbers(r);
      return (
        <>
          {r.model}
          {refs.length > 0 && (
            <sup className="ml-0.5 text-[10px] text-muted">
              {refs.map((n, i) => (
                <a key={n} href={`#deepswe-note-${n}`} className="hover:text-ink">
                  {i > 0 && ","}
                  {n}
                </a>
              ))}
            </sup>
          )}
        </>
      );
    },
    emphasis: true,
  },
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
    key: "range",
    label: "95% range",
    align: "right",
    render: (r) => <span className="text-muted">±{range95(r).toFixed(1)}</span>,
  },
  {
    key: "broke",
    label: "broke tests",
    align: "right",
    sort: (r) => r.regressions / r.planned,
    render: (r) => String(r.regressions),
    // Scaled to a 15% ceiling — the worst run (GPT-6 Luna, 1.0.105) is 13.1%; the count is the value.
    bar: (r) => r.regressions / r.planned / 0.15,
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

/**
 * The table, then its footnotes and definitions folded into one disclosure so scrolling readers
 * aren't met by a wall of small print. Selecting a footnote mark in the table opens it at that note.
 */

export function DeepSweTable({ definitions, source }: { definitions: ReactNode; source: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openNote = (event: MouseEvent<HTMLDivElement>) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#deepswe-note-"]');
    if (!link) return;
    event.preventDefault();
    const id = link.getAttribute("href")!.slice(1);
    setOpen(true);
    // Scroll once the disclosure has rendered open.
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      history.replaceState(null, "", `#${id}`);
    });
  };

  return (
    <div className="flex flex-col gap-4" onClick={openNote}>
      <PreviewTable
        rows={runs}
        columns={deepColumns}
        initial={byPassRate}
        preview={5}
        noun="configurations"
        caption="DeepSWE results for every configuration. Select a column header to sort."
      />
      <div className="relative font-mono text-xs text-muted">
        {/* Kept outside <summary> so following the link doesn't also toggle the notes. */}
        <span className="mb-1 block sm:absolute sm:top-0 sm:right-0 sm:mb-0 sm:inline-flex sm:min-h-8 sm:items-center sm:gap-1">{source}</span>
        <details
          open={open}
          onToggle={(event) => setOpen(event.currentTarget.open)}
          className="group"
        >
          <summary className="inline-flex min-h-8 cursor-pointer list-none items-center gap-2 text-ink-2 sm:pr-40 hover:text-ink [&::-webkit-details-marker]:hidden">
            <span aria-hidden className="inline-block transition-transform group-open:rotate-90">›</span>
            Notes on {runs.filter((r) => runNotes(r).length).length} runs and how to read this table
          </summary>
          <div className="mt-3 flex flex-col gap-4 border-t border-line pt-4">
            <ol className="m-0 flex list-none flex-col gap-1 p-0">
              {noteText.map((note, i) => (
                <li key={note} id={`deepswe-note-${i + 1}`} className="scroll-mt-24">
                  <sup>{i + 1}</sup> {note}
                </li>
              ))}
            </ol>
            <p className="m-0">{definitions}</p>
          </div>
        </details>
      </div>
    </div>
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
        <PreviewTable
          // Remount when the filters change, so a new selection opens as a preview again.
          key={`${harness}|${model}`}
          rows={shown}
          columns={sweColumns}
          initial={sweOrder}
          preview={8}
          noun="runs"
          caption="WharfSWE results for every run. Select a column header to sort."
        />
      ) : (
        <p className="m-0 border border-line bg-surface p-6 text-ink-2">No runs match both filters.</p>
      )}
    </div>
  );
}
