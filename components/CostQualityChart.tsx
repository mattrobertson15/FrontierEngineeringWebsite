"use client";

import { useState } from "react";
import { passRate, pct, range95, usd, type WharfRun } from "@/content/wharf";

/* Pass rate against cost or agent time. Hover or focus a dot for its run and its 95% range. */

const W = 720;
const H = 440;
const pad = { top: 24, right: 28, bottom: 52, left: 56 };
const xMin = 0.06;
const xMax = 16;
const yMin = 0.3;
const yMax = 0.85;
const xTicks = [0.1, 0.2, 0.5, 1, 2, 5, 10];
const yTicks = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8];

const costX = (cost: number) =>
  pad.left +
  ((Math.log(cost) - Math.log(xMin)) / (Math.log(xMax) - Math.log(xMin))) *
    (W - pad.left - pad.right);
const y = (rate: number) =>
  pad.top + (1 - (rate - yMin) / (yMax - yMin)) * (H - pad.top - pad.bottom);

type Label = { id: string; text: string; anchor?: "start" | "end"; dy?: number };

export function CostQualityChart({
  runs,
  labels,
  pair,
}: {
  runs: WharfRun[];
  labels: Label[];
  /** Two run ids joined by a connector — the same model under two harnesses. */
  pair: [string, string];
}) {
  const [active, setActive] = useState<string | null>(null);
  const [duration, setDuration] = useState(false);
  const [showPair, setShowPair] = useState(false);
  const plotted = runs.flatMap((run) => {
    const value = duration ? run.agentSeconds / 60 : run.costPerAttempt;
    return value != null && value > 0 ? [{ ...run, value }] : [];
  });
  const durationMax = Math.ceil(Math.max(10, ...plotted.map((run) => run.value)) / 10) * 10;
  const ticks = duration ? Array.from({ length: durationMax / 10 + 1 }, (_, i) => i * 10) : xTicks;
  const x = (value: number) => duration
    ? pad.left + (value / durationMax) * (W - pad.left - pad.right)
    : costX(value);
  const frontier = plotted.filter((run) => !plotted.some((other) =>
    other.value <= run.value && passRate(other) >= passRate(run) &&
      (other.value < run.value || passRate(other) > passRate(run)),
  )).sort((a, b) => a.value - b.value);
  const frontierIds = new Set(frontier.map((run) => run.id));
  const at = (run: (typeof plotted)[number]) => ({ cx: x(run.value), cy: y(passRate(run)) });
  const [a, b] = pair.map((id) => plotted.find((run) => run.id === id));
  const labelRuns = [...frontier, ...plotted.filter((run) =>
    !frontierIds.has(run.id) && ((showPair && pair.includes(run.id)) ||
      (duration && run.costPerAttempt === null)),
  )];
  const hovered = plotted.find((r) => r.id === active);
  // The chart sits in a scroll container that clips overflow, so near either edge the
  // tooltip grows inward from the dot instead of centring on it.
  const hx = hovered ? x(hovered.value) / W : 0;
  const alignX = hx < 0.3 ? "-translate-x-[14px]" : hx > 0.7 ? "-translate-x-[calc(100%-14px)]" : "-translate-x-1/2";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-2 pb-3 font-mono text-xs">
        <div role="group" aria-label="Horizontal axis" className="flex border border-line">
          {["Cost", "Duration"].map((label) => {
            const isDuration = label === "Duration";
            const selected = duration === isDuration;
            return (
              <button key={label} type="button" aria-pressed={selected}
                onClick={() => { setDuration(isDuration); setActive(null); }}
                className={`min-h-9 px-3 ${selected ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}>
                {label}
              </button>
            );
          })}
        </div>
        <span className="flex items-center gap-2 text-ink-2">
          <span aria-hidden="true" className="h-0.5 w-5 bg-accent" />
          {duration ? "Duration–quality frontier" : "Cost–quality frontier"}
        </span>
        <label className="flex items-center gap-2 text-ink-2">
          <input type="checkbox" className="accent-ink" checked={showPair} onChange={(event) => setShowPair(event.target.checked)} />
          Compare Opus 5 harnesses
        </label>
      </div>
      <div className="overflow-x-auto">
        <div className="relative min-w-[560px]">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full font-mono"
            role="group"
            aria-label={`Scatter plot of pass rate against ${duration ? "mean agent duration" : "mean cost per costed attempt"}. Full data in the table below.`}
          >
            {yTicks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} className="stroke-line" />
                <text x={pad.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[12px]">
                  {Math.round(t * 100)}%
                </text>
              </g>
            ))}
            {ticks.map((t) => (
              <text key={t} x={x(t)} y={H - pad.bottom + 22} textAnchor="middle" className="fill-muted text-[12px]">
                {duration ? t : `$${t}`}
              </text>
            ))}
            <text x={(pad.left + W - pad.right) / 2} y={H - 8} textAnchor="middle" className="fill-muted text-[12px]">
              {duration ? "mean agent time per attempt (minutes) →" : "mean cost per costed attempt (log scale) →"}
            </text>
            <text transform={`translate(14 ${(pad.top + H - pad.bottom) / 2}) rotate(-90)`} textAnchor="middle" className="fill-muted text-[12px]">
              pass@1 →
            </text>

            <polyline
              points={frontier.map((run) => {
                const { cx, cy } = at(run);
                return `${cx},${cy}`;
              }).join(" ")}
              fill="none"
              className="stroke-accent"
              strokeWidth={2}
            />
            {showPair && a && b && (
              <line x1={at(a).cx} y1={at(a).cy} x2={at(b).cx} y2={at(b).cy} className="stroke-ink-2" strokeDasharray="5 4" />
            )}

            {hovered && (() => {
              const { cx } = at(hovered);
              const half = range95(hovered) / 100;
              const top = y(Math.min(yMax, passRate(hovered) + half));
              const bottom = y(Math.max(yMin, passRate(hovered) - half));
              return (
                <g className="pointer-events-none stroke-ink-2" aria-hidden="true">
                  <line x1={cx} x2={cx} y1={top} y2={bottom} strokeWidth={1.5} />
                  <line x1={cx - 5} x2={cx + 5} y1={top} y2={top} strokeWidth={1.5} />
                  <line x1={cx - 5} x2={cx + 5} y1={bottom} y2={bottom} strokeWidth={1.5} />
                </g>
              );
            })()}

            {plotted.map((r) => {
              const { cx, cy } = at(r);
              const leading = frontierIds.has(r.id);
              const paired = showPair && pair.includes(r.id);
              const on = active === r.id;
              const focus = () => setActive(r.id);
              const blur = () => setActive((cur) => (cur === r.id ? null : cur));
              return (
                <g
                  key={r.id}
                  tabIndex={0}
                  role="img"
                  aria-label={`${r.model}, ${r.harness} ${r.version}: ${pct(passRate(r))} pass rate (95% range ±${range95(r).toFixed(1)} points), ${duration ? `${(r.agentSeconds / 60).toFixed(1)} minutes` : `${usd(r.costPerAttempt)} per costed attempt`}`}
                  onPointerEnter={focus}
                  onPointerLeave={blur}
                  onClick={focus}
                  onFocus={focus}
                  onBlur={blur}
                  className="cursor-default outline-none"
                >
                  <circle cx={cx} cy={cy} r={14} fill="transparent" />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={on ? 8 : leading ? 6 : 5}
                    className={`stroke-surface ${leading ? "fill-accent" : on || paired ? "fill-ink" : "fill-ink/35"}`}
                    strokeWidth={2}
                  />
                </g>
              );
            })}

            {labelRuns.map((run) => {
              const label = labels.find((entry) => entry.id === run.id);
              const { cx, cy } = at(run);
              const anchor = label?.anchor ?? (cx > W * 0.65 ? "end" : "start");
              const dy = label?.dy ?? (frontierIds.has(run.id) ? -12 : 0);
              return (
                <text
                  key={run.id}
                  x={cx + (anchor === "start" ? 12 : -12)}
                  y={cy + dy}
                  dy="0.32em"
                  textAnchor={anchor}
                  className="pointer-events-none fill-ink-2 text-[12px]"
                >
                  {label?.text ?? run.model}
                </text>
              );
            })}
          </svg>

          {hovered && (
            <div
              className={`pointer-events-none absolute z-10 w-max max-w-[240px] border border-line bg-paper px-3 py-2 font-mono text-xs text-ink-2 shadow-sm ${alignX} ${
                y(passRate(hovered)) < H / 2 ? "translate-y-[14px]" : "-translate-y-[calc(100%+14px)]"
              }`}
              style={{
                left: `${hx * 100}%`,
                top: `${(y(passRate(hovered)) / H) * 100}%`,
              }}
            >
              <p className="m-0 font-sans text-sm font-semibold text-ink">{hovered.model}</p>
              <p className="m-0">
                {hovered.harness} {hovered.version} · {hovered.effort}
              </p>
              <p className="m-0 mt-1">
                {hovered.passing}/{hovered.planned} passed · {pct(passRate(hovered))}
              </p>
              <p className="m-0">95% range ±{range95(hovered).toFixed(1)} points</p>
              <p className="m-0">
                {duration
                  ? `${(hovered.agentSeconds / 60).toFixed(1)} min mean agent time`
                  : `${usd(hovered.costPerAttempt)}/attempt · ${Math.round(hovered.costCoverage * 100)}% costed`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
