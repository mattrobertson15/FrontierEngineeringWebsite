"use client";

import { useState } from "react";
import { passRate, pct, runs, taskCount, tasksMixed, type WharfRun } from "@/content/wharf";

/*
 * One bar per run, split by what happened on each of the 113 tasks: solved on every attempt,
 * on some, or on none. Two runs with the same pass rate can split very differently.
 */

const parts = [
  { key: "always", label: "solved every attempt", fill: "bg-seq-3", value: (r: WharfRun) => r.tasksAllPass },
  { key: "sometimes", label: "solved some attempts", fill: "bg-seq-2", value: tasksMixed },
  { key: "never", label: "never solved", fill: "bg-seq-1", value: (r: WharfRun) => r.tasksNoPass },
] as const;

const sorts = [
  { key: "rate", label: "pass@1", by: (r: WharfRun) => passRate(r) },
  { key: "always", label: "Every attempt", by: (r: WharfRun) => r.tasksAllPass },
  { key: "reach", label: "At least once", by: (r: WharfRun) => taskCount - r.tasksNoPass },
] as const;

type SortKey = (typeof sorts)[number]["key"];

export function ConsistencyChart({ highlight }: { highlight: string[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("rate");
  const [active, setActive] = useState<string | null>(null);
  const by = sorts.find((s) => s.key === sortKey)!.by;
  const rows = [...runs].sort((a, b) => by(b) - by(a) || passRate(b) - passRate(a));

  return (
    <div className="border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 font-mono text-xs">
        <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-ink-2" aria-label="Legend">
          {parts.map((p) => (
            <li key={p.key} className="flex items-center gap-2">
              <span aria-hidden className={`h-2.5 w-2.5 rounded-[2px] ${p.fill}`} />
              {p.label}
            </li>
          ))}
        </ul>
        <div role="group" aria-label="Sort runs by" className="flex items-center gap-2 text-muted">
          sort
          <div className="flex border border-line">
            {sorts.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-pressed={sortKey === s.key}
                onClick={() => setSortKey(s.key)}
                className={`min-h-8 px-2.5 ${sortKey === s.key ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ol className="m-0 list-none p-0 py-2">
        {rows.map((r) => {
          const on = active === r.id;
          const marked = highlight.includes(r.id);
          const [always, sometimes, never] = parts.map((p) => p.value(r));
          return (
            <li
              key={r.id}
              tabIndex={0}
              aria-label={`${r.model}, ${r.harness} ${r.version}: ${pct(passRate(r))} pass rate. Of ${taskCount} tasks, ${always} solved on every attempt, ${sometimes} on some, ${never} never.`}
              onPointerEnter={() => setActive(r.id)}
              onPointerLeave={() => setActive((cur) => (cur === r.id ? null : cur))}
              onFocus={() => setActive(r.id)}
              onBlur={() => setActive((cur) => (cur === r.id ? null : cur))}
              className={`relative grid grid-cols-1 gap-1.5 px-4 py-1.5 outline-none sm:grid-cols-[minmax(0,15rem)_1fr_7.5rem] sm:items-center sm:gap-4 ${on ? "bg-paper" : ""}`}
            >
              <span className="flex min-w-0 items-baseline gap-2 font-mono text-xs">
                {marked && <span aria-hidden className="h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full bg-accent" />}
                <span className={`truncate ${marked ? "text-ink" : "text-ink-2"}`}>
                  {r.model} <span className="text-muted">· {r.harness === "Copilot" ? r.version : `${r.harness} ${r.version}`}</span>
                </span>
              </span>
              <span className="flex h-3.5 gap-[2px]" aria-hidden>
                {parts
                  .map((p) => ({ ...p, n: p.value(r) }))
                  .filter((s) => s.n > 0)
                  .map((s, i, shown) => (
                    <span
                      key={s.key}
                      className={`${s.fill} ${i === 0 ? "rounded-l-[4px]" : ""} ${i === shown.length - 1 ? "rounded-r-[4px]" : ""}`}
                      style={{ flex: `${s.n} 1 0` }}
                    />
                  ))}
              </span>
              <span className="hidden text-right font-mono text-xs tabular-nums text-ink-2 sm:block" aria-hidden>
                {always} · {sometimes} · {never}
              </span>

              {on && (
                <div className="pointer-events-none absolute right-4 top-full z-10 w-max max-w-[260px] -translate-y-1 border border-line bg-paper px-3 py-2 font-mono text-xs text-ink-2 shadow-sm">
                  <p className="m-0 font-sans text-sm font-semibold text-ink">{r.model}</p>
                  <p className="m-0">
                    {r.harness} {r.version} · {r.effort} · {pct(passRate(r))} pass@1
                  </p>
                  <p className="m-0 mt-1">{always} tasks solved every attempt</p>
                  <p className="m-0">{sometimes} solved on some attempts</p>
                  <p className="m-0">{never} never solved</p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="m-0 border-t border-line px-4 py-3 font-mono text-xs text-muted">
        Numbers at right: tasks solved every attempt · some attempts · never, out of {taskCount}. Copper dots mark the
        two runs compared above. Hover or tab through a row for details.
      </p>
    </div>
  );
}
