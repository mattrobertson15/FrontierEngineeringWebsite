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
    ticks: [44, 48, 52, 56],
    axis: "passing trials of 56 (axis starts at 44)",
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

const W = 720;
const H = 380;
const pad = { top: 20, right: 24, bottom: 52, left: 60 };

export function RevisionChart({ series }: { series: Series[] }) {
  const [metricKey, setMetricKey] = useState("passes");
  const [focusModel, setFocusModel] = useState<string | null>(null);
  const [hoverRev, setHoverRev] = useState<number | null>(null);
  const metric = metrics.find((m) => m.key === metricKey)!;

  const revs = [...new Set(series.flatMap((s) => s.points.map((p) => p.rev)))].sort((a, b) => a - b);
  const rMin = revs[0];
  const rMax = revs.at(-1)!;
  const [lo, hi] = metric.domain ?? [metric.ticks[0], metric.ticks.at(-1)!];
  const x = (rev: number) => pad.left + ((rev - rMin) / (rMax - rMin)) * (W - pad.left - pad.right);
  const t = (v: number) => (metric.log ? Math.log(v) : v);
  const y = (v: number) => pad.top + (1 - (t(v) - t(lo)) / (t(hi) - t(lo))) * (H - pad.top - pad.bottom);

  const xTicks = revs.filter((r) => r % 5 === 0 || r === rMin || r === rMax);
  const nearest = (px: number) => revs.reduce((best, r) => (Math.abs(x(r) - px) < Math.abs(x(best) - px) ? r : best), rMin);
  const atRev = hoverRev === null ? [] : series.flatMap((s) => {
    const p = s.points.find((q) => q.rev === hoverRev);
    return p ? [{ s, run: p.run }] : [];
  });
  atRev.sort((a, b) => metric.value(b.run) - metric.value(a.run));

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
        <ul className="m-0 flex list-none flex-wrap gap-1 p-0" aria-label="Legend — select a model to highlight it">
          {series.map((s) => (
            <li key={s.model}>
              <button type="button" aria-pressed={focusModel === s.model}
                onClick={() => setFocusModel((cur) => (cur === s.model ? null : s.model))}
                className={`flex min-h-9 items-center gap-2 border px-2.5 font-mono text-xs transition-colors ${
                  focusModel === s.model ? "border-ink text-ink" : "border-transparent text-ink-2 hover:text-ink"
                } ${dim(s.model) ? "opacity-50" : ""}`}>
                <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} aria-hidden />
                {s.model}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-x-auto">
        <div className="relative min-w-[560px]">
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full font-mono" role="img"
            aria-label={`Line chart of ${metric.label.toLowerCase()} by Copilot CLI revision for ${series.map((s) => s.model).join(", ")}. Values are in the table below.`}>
            {metric.ticks.map((v) => (
              <g key={v}>
                <line x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} className="stroke-line" />
                <text x={pad.left - 10} y={y(v)} dy="0.32em" textAnchor="end" className="fill-muted text-[12px]">
                  {metric.key === "passes" ? v : metric.format(v)}
                </text>
              </g>
            ))}
            {xTicks.map((r) => (
              <text key={r} x={x(r)} y={H - pad.bottom + 22} textAnchor="middle" className="fill-muted text-[12px]">
                .{r}
              </text>
            ))}
            <text x={(pad.left + W - pad.right) / 2} y={H - 8} textAnchor="middle" className="fill-muted text-[12px]">
              Copilot CLI release 1.0.x →
            </text>
            <text transform={`translate(14 ${(pad.top + H - pad.bottom) / 2}) rotate(-90)`} textAnchor="middle" className="fill-muted text-[12px]">
              {metric.axis}
            </text>

            {hoverRev !== null && (
              <line x1={x(hoverRev)} x2={x(hoverRev)} y1={pad.top} y2={H - pad.bottom} className="stroke-field" strokeWidth={1} />
            )}

            {/* Focused series draws last so it sits on top. */}
            {[...series].sort((a, b) => Number(a.model === focusModel) - Number(b.model === focusModel)).map((s) => {
              const pts = s.points.filter((p) => Number.isFinite(metric.value(p.run)));
              const d = pts.map((p, i) => `${i ? "L" : "M"}${x(p.rev).toFixed(1)},${y(metric.value(p.run)).toFixed(1)}`).join("");
              return (
                <g key={s.model} style={{ opacity: dim(s.model) ? 0.15 : 1 }} className="transition-opacity">
                  <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
                  {pts.map((p) => (
                    <circle key={p.rev} cx={x(p.rev)} cy={y(metric.value(p.run))} r={p.rev === hoverRev ? 5.5 : 4}
                      fill={s.color} className="stroke-surface" strokeWidth={2} />
                  ))}
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
                <p className="m-0">no tracked runs</p>
              ) : (
                atRev.map(({ s, run }) => (
                  <p key={s.model} className="m-0 flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />
                    <span className="grow">{s.model}</span>
                    <span className="text-ink tabular-nums">{metric.format(metric.value(run))}</span>
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
