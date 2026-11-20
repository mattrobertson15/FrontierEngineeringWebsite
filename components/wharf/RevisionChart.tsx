"use client";

import { useState } from "react";
import type { SweRun } from "@/content/wharf-swe";

/*
 * Copilot CLI revision on x; one line per tracked model. Lines join observed runs only —
 * a skipped revision is not a measurement. Hover anywhere for every model at that revision.
 */

export type Series = { model: string; color: string; points: { rev: number; run: SweRun }[] };

type Metric = {
  key: string;
  label: string;
  value: (r: SweRun) => number;
  format: (v: number) => string;
  ticks: number[];
  /** Plot range when it should extend past the outer ticks. */
  domain?: [number, number];
  log?: boolean;
  axis: string;
};

const mmss = (s: number) => {
  const seconds = Math.round(s);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

const metrics: Metric[] = [
  {
    key: "passes",
    label: "Passing trials",
    value: (r) => r.passes,
    format: (v) => `${v}/56`,
    // The lowest observed result is 48/56; starting at 47 keeps every run on the plot without
    // spending a quarter of it on empty space. The axis label says the axis is cut.
    ticks: [48, 50, 52, 54, 56],
    domain: [47, 56],
    axis: "passing trials of 56 (axis starts at 47)",
  },
  {
    key: "cost",
    label: "Cost per trial",
    value: (r) => r.costPerTrial ?? NaN,
    format: (v) => `$${v.toFixed(v < 0.1 ? 3 : 2)}`,
    ticks: [0.01, 0.03, 0.1, 0.3, 1],
    domain: [0.01, 1.6],
    log: true,
    axis: "billed cost per trial (log scale)",
  },
  {
    key: "time",
    label: "Agent time",
    value: (r) => r.agentSeconds,
    format: mmss,
    ticks: [0, 120, 240, 360, 480],
    axis: "mean agent time per trial (m:ss)",
  },
];

/*
 * One hollow marker shape per series, in series order. Shape is a second cue beside colour, and
 * hollow shapes stay readable where several models land on the same value at the same release.
 */
const shapes = ["circle", "triangle", "diamond", "square", "triangle-down"] as const;
type Shape = (typeof shapes)[number];

function Marker({ shape, cx, cy, r, color }: { shape: Shape; cx: number; cy: number; r: number; color: string }) {
  const common = { fill: "var(--color-surface)", stroke: color, strokeWidth: 1.75, strokeLinejoin: "round" as const };
  if (shape === "circle") return <circle cx={cx} cy={cy} r={r} {...common} />;
  if (shape === "square") return <rect x={cx - r * 0.9} y={cy - r * 0.9} width={r * 1.8} height={r * 1.8} {...common} />;
  const k = r * 1.25;
  const pts =
    shape === "diamond"
      ? [[cx, cy - k], [cx + k, cy], [cx, cy + k], [cx - k, cy]]
      : shape === "triangle"
        ? [[cx, cy - k], [cx + k, cy + k * 0.8], [cx - k, cy + k * 0.8]]
        : [[cx, cy + k], [cx + k, cy - k * 0.8], [cx - k, cy - k * 0.8]];
  return <polygon points={pts.map((pt) => pt.join(",")).join(" ")} {...common} />;
}

/** A line-and-marker swatch for the legend and tooltip. */
function Swatch({ shape, color }: { shape: Shape; color: string }) {
  return (
    <svg viewBox="0 0 20 12" className="h-3 w-5 shrink-0" aria-hidden>
      <line x1={0} x2={20} y1={6} y2={6} stroke={color} strokeWidth={2} />
      <Marker shape={shape} cx={10} cy={6} r={3.5} color={color} />
    </svg>
  );
}

const W = 720;
const H = 380;
const pad = { top: 20, right: 24, bottom: 52, left: 60 };

export function RevisionChart({ series }: { series: Series[] }) {
  const [metricKey, setMetricKey] = useState("passes");
  const [showChange, setShowChange] = useState(false);
  const [focusModel, setFocusModel] = useState<string | null>(null);
  const [hoverRev, setHoverRev] = useState<number | null>(null);
  const metric = metrics.find((m) => m.key === metricKey)!;

  const observed = series.map((s) => ({
    ...s,
    points: s.points.flatMap((point, i) => {
      const previous = s.points[i - 1];
      const value = metric.value(point.run);
      const plotted = showChange ? value - (previous ? metric.value(previous.run) : NaN) : value;
      return Number.isFinite(plotted) ? [{ ...point, plotted, previous }] : [];
    }),
  }));
  const formatChange = (value: number, detail = false) => {
    const sign = value < 0 ? "−" : value > 0 ? "+" : "";
    const magnitude = Math.abs(value);
    if (metric.key === "passes") return `${sign}${magnitude}${detail ? (magnitude === 1 ? " pass" : " passes") : ""}`;
    if (metric.key === "time") return `${sign}${mmss(magnitude)}`;
    return `${sign}$${magnitude.toFixed(4)}`;
  };

  const revs = [...new Set(series.flatMap((s) => s.points.map((p) => p.rev)))].sort((a, b) => a - b);
  const rMin = revs[0];
  const rMax = revs.at(-1)!;
  const stepSize = metric.key === "passes" ? 1 : metric.key === "time" ? 60 : 0.05;
  const peak = Math.max(stepSize, ...observed.flatMap((s) => s.points.map((p) => Math.abs(p.plotted))));
  const halfRange = Math.ceil(peak / (2 * stepSize)) * stepSize;
  const ticks = showChange ? [-2 * halfRange, -halfRange, 0, halfRange, 2 * halfRange] : metric.ticks;
  const [lo, hi] = showChange ? [ticks[0], ticks.at(-1)!] : metric.domain ?? [ticks[0], ticks.at(-1)!];
  const x = (rev: number) => pad.left + ((rev - rMin) / (rMax - rMin)) * (W - pad.left - pad.right);
  const t = (v: number) => (metric.log && !showChange ? Math.log(v) : v);
  const y = (v: number) => pad.top + (1 - (t(v) - t(lo)) / (t(hi) - t(lo))) * (H - pad.top - pad.bottom);

  // Every tested release gets a label: the series are sparse, so counting gridlines is no help.
  const xTicks = revs;
  const shapeOf = (model: string) => shapes[series.findIndex((s) => s.model === model) % shapes.length];
  const nearest = (px: number) => revs.reduce((best, r) => (Math.abs(x(r) - px) < Math.abs(x(best) - px) ? r : best), rMin);
  const atRev = hoverRev === null ? [] : observed.flatMap((s) => {
    const point = s.points.find((p) => p.rev === hoverRev);
    return point ? [{ s, point }] : [];
  });
  atRev.sort((a, b) => b.point.plotted - a.point.plotted);
  const barWidth = Math.max(2, Math.min(6, (x(rMin + 1) - x(rMin) - 3) / series.length));

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
    setHoverRev(nearest(((e.clientX - box.left) / box.width) * W));
  };
  const step = (dir: 1 | -1) => {
    const i = hoverRev === null ? (dir === 1 ? -1 : revs.length) : revs.indexOf(hoverRev);
    setHoverRev(revs[Math.max(0, Math.min(revs.length - 1, i + dir))]);
  };

  const dim = (model: string) => focusModel !== null && focusModel !== model;
  const hx = hoverRev === null ? 0 : x(hoverRev) / W;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex border border-line" role="group" aria-label="Metric">
          {metrics.map((m) => (
            <button key={m.key} type="button" aria-pressed={m.key === metricKey} onClick={() => setMetricKey(m.key)}
              className={`min-h-9 px-3 font-mono text-xs transition-colors ${m.key === metricKey ? "bg-ink text-paper" : "bg-surface text-ink-2 hover:text-ink"}`}>
              {m.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 font-mono text-xs text-ink-2">
          <input type="checkbox" className="accent-ink" checked={showChange} onChange={(event) => setShowChange(event.target.checked)} />
          Change since prior tested release
        </label>
        <ul className="m-0 flex list-none flex-wrap gap-1 p-0" aria-label="Legend — select a model to highlight it">
          {series.map((s) => (
            <li key={s.model}>
              <button type="button" aria-pressed={focusModel === s.model}
                onClick={() => setFocusModel((cur) => (cur === s.model ? null : s.model))}
                className={`flex min-h-9 items-center gap-2 border px-2.5 font-mono text-xs transition-colors ${
                  focusModel === s.model ? "border-ink text-ink" : "border-transparent text-ink-2 hover:text-ink"
                } ${dim(s.model) ? "opacity-50" : ""}`}>
                <Swatch shape={shapeOf(s.model)} color={s.color} />
                {s.model}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-x-auto">
        <div className="relative min-w-[560px]">
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full font-mono" role="group"
            aria-label={`Chart of ${showChange ? "change in " : ""}${metric.label.toLowerCase()} by Copilot CLI revision for ${series.map((s) => s.model).join(", ")}. Values are in the table below.`}>
            {ticks.map((v) => (
              <g key={v}>
                <line x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} className={showChange && v === 0 ? "stroke-ink-2" : "stroke-line"} />
                <text x={pad.left - 10} y={y(v)} dy="0.32em" textAnchor="end" className="fill-muted text-[10px]">
                  {showChange ? formatChange(v) : metric.key === "passes" ? v : metric.format(v)}
                </text>
              </g>
            ))}
            {xTicks.map((r) => (
              <text key={r} x={x(r)} y={H - pad.bottom + 22} textAnchor="middle" className="fill-muted text-[10.5px]">
                .{r}
              </text>
            ))}
            <text x={(pad.left + W - pad.right) / 2} y={H - 8} textAnchor="middle" className="fill-muted text-[12px]">
              Copilot CLI release 1.0.x →
            </text>
            <text transform={`translate(14 ${(pad.top + H - pad.bottom) / 2}) rotate(-90)`} textAnchor="middle" className="fill-muted text-[12px]">
              {showChange ? `change in ${metric.label.toLowerCase()}` : metric.axis}
            </text>

            {hoverRev !== null && (
              <line x1={x(hoverRev)} x2={x(hoverRev)} y1={pad.top} y2={H - pad.bottom} className="stroke-field" strokeWidth={1} />
            )}

            {/* Focused series draws last so it sits on top. */}
            {[...observed].sort((a, b) => Number(a.model === focusModel) - Number(b.model === focusModel)).map((s) => {
              const pts = s.points;
              const d = pts.map((p, i) => `${i ? "L" : "M"}${x(p.rev).toFixed(1)},${y(p.plotted).toFixed(1)}`).join("");
              return (
                <g key={s.model} style={{ opacity: dim(s.model) ? 0.15 : 1 }} className="transition-opacity">
                  {showChange ? pts.map((p) => (
                    <rect key={p.rev}
                      x={x(p.rev) + (series.findIndex((entry) => entry.model === s.model) - series.length / 2) * barWidth}
                      y={Math.min(y(0), y(p.plotted)) - (p.plotted === 0 ? 1 : 0)}
                      width={barWidth - 1} height={Math.max(2, Math.abs(y(p.plotted) - y(0)))}
                      fill={s.color} />
                  )) : <>
                    <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
                    {pts.map((p) => (
                      <Marker key={p.rev} shape={shapeOf(s.model)} cx={x(p.rev)} cy={y(p.plotted)}
                        r={p.rev === hoverRev ? 5.5 : 4.5} color={s.color} />
                    ))}
                  </>}
                </g>
              );
            })}

            <rect x={pad.left - 8} y={pad.top} width={W - pad.left - pad.right + 16} height={H - pad.top - pad.bottom}
              fill="transparent" tabIndex={0} role="slider" aria-label="Copilot CLI revision"
              aria-valuemin={rMin} aria-valuemax={rMax} aria-valuenow={hoverRev ?? undefined}
              aria-valuetext={hoverRev === null ? "none" : `1.0.${hoverRev}`}
              onPointerMove={onMove} onPointerLeave={() => setHoverRev(null)} onBlur={() => setHoverRev(null)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
                if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
              }}
              className="cursor-crosshair outline-none focus-visible:stroke-accent" />
          </svg>

          {hoverRev !== null && (
            <div
              className={`pointer-events-none absolute top-2 z-10 w-max border border-line bg-paper px-3 py-2 font-mono text-xs text-ink-2 shadow-sm ${
                hx > 0.6 ? "-translate-x-[calc(100%+12px)]" : "translate-x-3"
              }`}
              style={{ left: `${hx * 100}%` }}
            >
              <p className="m-0 font-sans text-sm font-semibold text-ink">Copilot 1.0.{hoverRev}</p>
              {atRev.length === 0 ? (
                <p className="m-0">{showChange ? "No prior tracked run to compare" : "No tracked runs"}</p>
              ) : (
                atRev.map(({ s, point }) => (
                  <p key={s.model} className="m-0 flex items-center gap-2">
                    <Swatch shape={shapeOf(s.model)} color={s.color} />
                    <span className="grow">{s.model}</span>
                    {showChange && point.previous && <span className="text-muted">{point.previous.run.version} → {point.run.version}</span>}
                    <span className="text-ink tabular-nums">{showChange ? formatChange(point.plotted, true) : metric.format(point.plotted)}</span>
                  </p>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
