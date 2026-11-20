"use client";

import { useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";

/*
 * Every task (columns) against every configuration (rows). Each cell is the share of that run's
 * attempts on that task that passed, in five steps of one hue. A strip on top shows how hard each
 * task was across all runs; a strip underneath shows its language.
 */

export type HeatRow = { id: string; label: string; sub: string; attempts: number; passes: number[] };
export type HeatTask = { id: string; language: string; mean: number };

const heat = ["var(--color-heat-0)", "var(--color-heat-1)", "var(--color-heat-2)", "var(--color-heat-3)", "var(--color-heat-4)"];
const binLabels = ["none", "up to a quarter", "up to half", "most", "all"];
const bin = (share: number) => (share === 0 ? 0 : share <= 0.25 ? 1 : share <= 0.5 ? 2 : share < 1 ? 3 : 4);

// Languages in fixed order, colored from the site's validated categorical series.
const languageOrder = ["python", "go", "typescript", "javascript", "rust"];
const languageColor: Record<string, string> = {
  python: "var(--color-series-1)",
  go: "var(--color-series-3)",
  typescript: "var(--color-series-4)",
  javascript: "var(--color-series-5)",
  rust: "var(--color-series-2)",
};
// Group labels under narrow (5-task) groups need the short form to avoid colliding.
const languageShort: Record<string, string> = { javascript: "JS", typescript: "TS", python: "Py", go: "Go", rust: "Rust" };
const languageName: Record<string, string> = {
  python: "Python",
  go: "Go",
  typescript: "TypeScript",
  javascript: "JavaScript",
  rust: "Rust",
};

const labelW = 232;
const cellW = 8;
const pitchX = 9;
const cellH = 13;
const pitchY = 15;
const diffH = 28;
const top = diffH + 8;

export function DeepSweTaskHeatmap({ rows, tasks }: { rows: HeatRow[]; tasks: HeatTask[] }) {
  const [order, setOrder] = useState<"difficulty" | "language">("difficulty");
  const [active, setActive] = useState<{ r: number; c: number } | null>(null);

  // Column order: indexes into `tasks`.
  const columns = useMemo(() => {
    const idx = tasks.map((_, i) => i);
    const byEase = (a: number, b: number) => tasks[b].mean - tasks[a].mean;
    return order === "difficulty"
      ? idx.sort(byEase)
      : idx.sort((a, b) => languageOrder.indexOf(tasks[a].language) - languageOrder.indexOf(tasks[b].language) || byEase(a, b));
  }, [order, tasks]);

  const gridW = columns.length * pitchX;
  const gridH = rows.length * pitchY;
  const langY = top + gridH + 4;
  const W = labelW + gridW + 4;
  const H = langY + 10 + (order === "language" ? 18 : 4);
  const x = (c: number) => labelW + c * pitchX;
  const y = (r: number) => top + r * pitchY;

  const languageGroups = order === "language"
    ? languageOrder.map((lang) => {
        const cols = columns.flatMap((t, c) => (tasks[t].language === lang ? [c] : []));
        return { lang, from: cols[0], to: cols[cols.length - 1], n: cols.length };
      }).filter((g) => g.n)
    : [];

  const locate = (event: PointerEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const c = Math.floor((p.x - labelW) / pitchX);
    const r = Math.floor((p.y - top) / pitchY);
    setActive(c >= 0 && c < columns.length && r >= 0 && r < rows.length ? { r, c } : null);
  };

  const move = (event: KeyboardEvent<SVGSVGElement>) => {
    const step: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const d = step[event.key];
    if (!d) return;
    event.preventDefault();
    setActive((cur) => {
      const base = cur ?? { r: 0, c: 0 };
      return {
        r: Math.min(rows.length - 1, Math.max(0, base.r + (cur ? d[0] : 0))),
        c: Math.min(columns.length - 1, Math.max(0, base.c + (cur ? d[1] : 0))),
      };
    });
  };

  const cell = active && { row: rows[active.r], task: tasks[columns[active.c]], t: columns[active.c] };

  return (
    <>
      <TaskReachSummary rows={rows} tasks={tasks} />
      <figure className="m-0 hidden flex-col gap-3 md:flex">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-ink-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-muted">attempts passed</span>
            <span className="flex items-center gap-[2px]" aria-hidden>
              {heat.map((c, i) => (
                <span key={i} className="h-3 w-5 first:rounded-l-[4px] last:rounded-r-[4px]" style={{ background: c }} />
              ))}
            </span>
            <span>none → all</span>
            <span className="ml-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              {languageOrder.map((lang) => (
                <span key={lang} className="flex items-center gap-1.5">
                  <span aria-hidden className="h-2.5 w-2.5 rounded-[2px]" style={{ background: languageColor[lang] }} />
                  {languageName[lang]}
                </span>
              ))}
            </span>
          </div>
          <div role="group" aria-label="Order tasks" className="flex items-center gap-2 text-muted">
            tasks
            <div className="flex border border-line">
              {(["difficulty", "language"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={order === o}
                  onClick={() => setOrder(o)}
                  className={`min-h-8 px-2.5 ${order === o ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
                >
                  {o === "difficulty" ? "Easiest first" : "By language"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative overflow-x-auto border border-line bg-surface p-3">
          <div className="relative min-w-[900px]">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="block h-auto w-full font-mono outline-none focus-visible:ring-2 focus-visible:ring-ink"
              tabIndex={0}
              role="img"
              aria-label={`Heatmap of ${rows.length} configurations by ${tasks.length} tasks: the share of attempts that passed on each task. Use the arrow keys to read cells.`}
              onPointerMove={locate}
              onPointerLeave={() => setActive(null)}
              onKeyDown={move}
              onBlur={() => setActive(null)}
            >
              {/* Difficulty: mean pass share across all configurations, per task. */}
              <text x={labelW - 8} y={diffH / 2} dy="0.32em" textAnchor="end" className="fill-muted text-[10px]">
                all configs
              </text>
              {columns.map((t, c) => {
                const h = Math.max(1, tasks[t].mean * diffH);
                return <rect key={t} x={x(c)} y={diffH - h} width={cellW} height={h} rx={1} className="fill-slate/70" />;
              })}

              {rows.map((row, r) => (
                <g key={row.id}>
                  <text
                    x={labelW - 8}
                    y={y(r) + cellH / 2}
                    dy="0.32em"
                    textAnchor="end"
                    className={`text-[10.5px] ${active?.r === r ? "fill-ink font-semibold" : "fill-ink-2"}`}
                  >
                    {row.label}
                    <tspan className="fill-muted"> · {row.sub}</tspan>
                  </text>
                  {columns.map((t, c) => (
                    <rect
                      key={t}
                      x={x(c)}
                      y={y(r)}
                      width={cellW}
                      height={cellH}
                      rx={1.5}
                      style={{ fill: heat[bin(row.passes[t] / row.attempts)] }}
                    />
                  ))}
                </g>
              ))}

              {columns.map((t, c) => (
                <rect key={t} x={x(c)} y={langY} width={cellW} height={6} rx={1} style={{ fill: languageColor[tasks[t].language] }} />
              ))}
              {languageGroups.map((g) => (
                <text
                  key={g.lang}
                  x={(x(g.from) + x(g.to) + cellW) / 2}
                  y={langY + 19}
                  textAnchor="middle"
                  className="fill-ink-2 text-[10.5px]"
                >
                  {g.n * pitchX < 90 ? languageShort[g.lang] : `${languageName[g.lang]} (${g.n})`}
                </text>
              ))}

              {active && (
                <g className="pointer-events-none" fill="none">
                  <rect x={x(active.c) - 1.5} y={top - 2} width={cellW + 3} height={gridH + 2} className="stroke-accent" strokeWidth={1} />
                  <rect x={labelW - 2} y={y(active.r) - 1.5} width={gridW + 2} height={cellH + 3} className="stroke-accent" strokeWidth={1} />
                  <rect x={x(active.c) - 1.5} y={y(active.r) - 1.5} width={cellW + 3} height={cellH + 3} className="stroke-surface" strokeWidth={2} />
                </g>
              )}
            </svg>

            {cell && (
              <div
                className={`pointer-events-none absolute z-10 w-max max-w-[280px] border border-line bg-paper px-3 py-2 font-mono text-xs text-ink-2 shadow-sm ${
                  active!.c > columns.length * 0.6 ? "-translate-x-[calc(100%+12px)]" : "translate-x-3"
                }`}
                style={{ left: `${((x(active!.c) + cellW) / W) * 100}%`, top: `${((y(active!.r) + cellH) / H) * 100}%` }}
              >
                <p className="m-0 font-sans text-sm font-semibold break-words text-ink">{cell.task.id}</p>
                <p className="m-0">
                  {languageName[cell.task.language]} · {Math.round(cell.task.mean * 100)}% passed across all configs
                </p>
                <p className="m-0 mt-1 text-ink">
                  {cell.row.label} · {cell.row.sub}
                </p>
                <p className="m-0">
                  {cell.row.passes[cell.t]}/{cell.row.attempts} attempts passed ({binLabels[bin(cell.row.passes[cell.t] / cell.row.attempts)]})
                </p>
              </div>
            )}
          </div>
        </div>
        <figcaption className="font-mono text-xs text-muted">
          Rows: configurations, best pass rate first. Columns: the {tasks.length} tasks. Top strip: share of
          attempts that passed on each task across all configurations. Hover a cell, or focus the chart and use
          the arrow keys.
        </figcaption>
      </figure>
    </>
  );
}

/**
 * The heatmap's story for small screens: how many configurations solved each task at least once,
 * grouped, plus the hardest tasks by name. Single series, so one colour; every bar is labelled.
 */
function TaskReachSummary({ rows, tasks }: { rows: HeatRow[]; tasks: HeatTask[] }) {
  const n = rows.length;
  const reach = tasks.map((_, t) => rows.filter((r) => r.passes[t] > 0).length);
  const groups = [
    { label: `All ${n}`, test: (k: number) => k === n },
    { label: `${n - 5}–${n - 1}`, test: (k: number) => k >= n - 5 && k < n },
    { label: `${n - 10}–${n - 6}`, test: (k: number) => k >= n - 10 && k < n - 5 },
    { label: `${n - 15}–${n - 11}`, test: (k: number) => k >= n - 15 && k < n - 10 },
    { label: `1–${n - 16}`, test: (k: number) => k >= 1 && k < n - 15 },
    { label: "None", test: (k: number) => k === 0 },
  ].map((g) => ({ ...g, count: reach.filter(g.test).length }));
  const most = Math.max(...groups.map((g) => g.count));
  const hardest = tasks
    .map((task, t) => ({ task, reach: reach[t] }))
    .sort((a, b) => a.reach - b.reach || a.task.mean - b.task.mean)
    .slice(0, 3);

  return (
    <figure className="m-0 flex flex-col gap-4 md:hidden">
      <div className="border border-line bg-surface p-4">
        <p className="m-0 mb-3 font-mono text-xs text-muted">
          Tasks by how many of the {n} configurations solved them at least once
        </p>
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {groups.map((g) => (
            <li key={g.label} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-3 font-mono text-xs">
              <span className="text-ink-2">{g.label}</span>
              <span className="flex h-3 items-center">
                {g.count > 0 && <span className="h-3 rounded-r-[4px] bg-ink" style={{ width: `${(g.count / most) * 100}%` }} />}
              </span>
              <span className="text-right tabular-nums text-ink">{g.count}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="border border-line bg-surface p-4">
        <p className="m-0 mb-2 font-mono text-xs text-muted">Hardest tasks</p>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
          {hardest.map(({ task, reach: k }) => (
            <li key={task.id} className="flex flex-col">
              <code className="font-mono text-[13px] break-words text-ink">{task.id}</code>
              <span className="font-mono text-xs text-muted">
                solved by {k} of {n} configurations · {Math.round(task.mean * 100)}% of attempts passed
              </span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="font-mono text-xs text-muted">
        The full task-by-configuration grid shows on a larger screen.
      </figcaption>
    </figure>
  );
}
