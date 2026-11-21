import { passRate, pct, taskCount, tasksMixed, type WharfRun } from "@/content/wharf";

/*
 * Small server-rendered charts that sit beside a finding and make its point without a legend
 * to study. The full, interactive charts live in their own components.
 */

/** Two or three runs as one bar each: tasks solved every attempt, some attempts, never. */
export function ConsistencyPair({ runs }: { runs: WharfRun[] }) {
  return (
    <div
      className="flex flex-col gap-3"
      role="img"
      aria-label={`Tasks solved on every attempt, out of ${taskCount}: ${runs.map((r) => `${r.model} ${r.tasksAllPass}`).join(", ")}`}
    >
      {runs.map((r) => (
        <div key={r.id} className="flex flex-col gap-1.5">
          <span className="flex justify-between gap-4 font-mono text-xs text-ink-2">
            <span>
              {r.model} · {pct(passRate(r))} pass rate
            </span>
            <span className="tabular-nums text-muted">
              {r.tasksAllPass} · {tasksMixed(r)} · {r.tasksNoPass}
            </span>
          </span>
          <span className="flex h-4 gap-[2px]" aria-hidden>
            {[
              { n: r.tasksAllPass, fill: "bg-seq-3" },
              { n: tasksMixed(r), fill: "bg-seq-2" },
              { n: r.tasksNoPass, fill: "bg-seq-1" },
            ].map((s, i) => (
              <span
                key={i}
                className={`${s.fill} ${i === 0 ? "rounded-l-[4px]" : ""} ${i === 2 ? "rounded-r-[4px]" : ""}`}
                style={{ flex: `${s.n} 1 0` }}
              />
            ))}
          </span>
        </div>
      ))}
      <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 font-mono text-xs text-muted" aria-hidden>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-seq-3" /> solved every attempt
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-seq-2" /> some attempts
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-seq-1" /> never
        </li>
      </ul>
    </div>
  );
}

export type StripPoint = {
  v: number;
  kind: "accent" | "ink" | "faint" | "ring";
  label?: string;
  anchor?: "start" | "middle" | "end";
  /** Put the label above the dot instead of beside it. */
  above?: boolean;
};

/** Dots on a shared horizontal scale, one row per series; a rule joins a row's dots when `connect`. */
export function Strip({
  rows,
  min,
  max,
  ticks,
  format,
  log = false,
  labelWidth = 0,
  title,
}: {
  rows: { label?: string; connect?: boolean; points: StripPoint[] }[];
  min: number;
  max: number;
  ticks: number[];
  format: (t: number) => string;
  log?: boolean;
  labelWidth?: number;
  title: string;
}) {
  const W = 280;
  const rowH = 22;
  const top = 20;
  const H = top + rows.length * rowH + 16;
  // Room either side for a centred tick label or dot label at the ends of the scale.
  const left = labelWidth ? labelWidth + 8 : 22;
  const right = 22;
  const f = (v: number) => (log ? Math.log(v) : v);
  const x = (v: number) => left + ((f(v) - f(min)) / (f(max) - f(min))) * (W - left - right);
  const axisY = top + rows.length * rowH - 6;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full font-mono" role="img" aria-label={title}>
      <title>{title}</title>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={top - 6} y2={axisY} className="stroke-line" />
          <text x={x(t)} y={axisY + 13} textAnchor="middle" className="fill-muted text-[10px]">
            {format(t)}
          </text>
        </g>
      ))}
      {rows.map((row, i) => {
        const cy = top + i * rowH + 4;
        const xs = row.points.map((p) => x(p.v));
        return (
          <g key={i}>
            {row.label && (
              <text x={0} y={cy} dy="0.32em" className="fill-ink-2 text-[11px]">
                {row.label}
              </text>
            )}
            {row.connect && (
              <line x1={Math.min(...xs)} x2={Math.max(...xs)} y1={cy} y2={cy} className="stroke-ink-2" strokeWidth={1.5} />
            )}
            {row.points.map((p, j) => (
              <g key={j}>
                <circle
                  cx={x(p.v)}
                  cy={cy}
                  r={p.kind === "faint" ? 3.5 : 5}
                  strokeWidth={p.kind === "ring" ? 1.75 : 2}
                  className={
                    p.kind === "accent"
                      ? "fill-accent stroke-surface"
                      : p.kind === "ink"
                        ? "fill-ink stroke-surface"
                        : p.kind === "ring"
                          ? "fill-surface stroke-ink-2"
                          : "fill-ink/30 stroke-surface"
                  }
                />
                {p.label && (
                  <text
                    x={x(p.v) + (p.anchor === "end" ? -8 : p.anchor === "start" ? 8 : 0)}
                    y={p.above ? cy - 10 : cy}
                    dy={p.above ? 0 : "0.32em"}
                    textAnchor={p.anchor ?? "start"}
                    className="fill-ink-2 text-[11px]"
                  >
                    {p.label}
                  </text>
                )}
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
