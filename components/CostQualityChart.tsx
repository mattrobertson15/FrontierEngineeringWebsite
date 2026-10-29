"use client";

import { useState } from "react";
import { passRate, pct, usd, type WharfRun } from "@/content/wharf";

/* Pass rate vs cost per attempt, log-scale x. Hover or focus a dot for its run. */

const W = 720;
const H = 440;
const pad = { top: 24, right: 28, bottom: 52, left: 56 };
const xMin = 0.15;
const xMax = 16;
const yMin = 0.3;
const yMax = 0.8;
const xTicks = [0.2, 0.5, 1, 2, 5, 10];
const yTicks = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8];

const x = (cost: number) =>
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
  const plotted = runs.filter((r) => r.costPerAttempt !== null);
  const at = (id: string) => {
    const r = plotted.find((p) => p.id === id)!;
    return { cx: x(r.costPerAttempt!), cy: y(passRate(r)) };
  };
  const [a, b] = pair.map(at);
  const hovered = plotted.find((r) => r.id === active);

  return (
    // Below ~560px the labels shrink past legibility; the parent scrolls instead.
    <div className="relative min-w-[560px]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full font-mono"
        role="img"
        aria-label="Scatter plot of pass rate against mean cost per attempt for each agent configuration. Full data in the table below."
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} className="stroke-line" />
            <text x={pad.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[12px]">
              {Math.round(t * 100)}%
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={x(t)} y={H - pad.bottom + 22} textAnchor="middle" className="fill-muted text-[12px]">
            ${t}
          </text>
        ))}
        <text x={(pad.left + W - pad.right) / 2} y={H - 8} textAnchor="middle" className="fill-muted text-[12px]">
          mean cost per attempt (log scale) →
        </text>
        <text transform={`translate(14 ${(pad.top + H - pad.bottom) / 2}) rotate(-90)`} textAnchor="middle" className="fill-muted text-[12px]">
          pass@1 →
        </text>

        <line x1={a.cx} y1={a.cy} x2={b.cx} y2={b.cy} className="stroke-accent" strokeWidth={2} />

        {plotted.map((r) => {
          const cx = x(r.costPerAttempt!);
          const cy = y(passRate(r));
          const on = active === r.id;
          const focus = () => setActive(r.id);
          const blur = () => setActive((cur) => (cur === r.id ? null : cur));
          return (
            <g
              key={r.id}
              tabIndex={0}
              role="button"
              aria-label={`${r.model}, ${r.harness} ${r.version}: ${pct(passRate(r))} pass rate, ${usd(r.costPerAttempt)} per attempt`}
              onPointerEnter={focus}
              onPointerLeave={blur}
              onFocus={focus}
              onBlur={blur}
              className="cursor-default outline-none"
            >
              <circle cx={cx} cy={cy} r={14} fill="transparent" />
              <circle
                cx={cx}
                cy={cy}
                r={on ? 7 : 5}
                className={`stroke-surface ${pair.includes(r.id) ? "fill-accent" : "fill-ink"}`}
                strokeWidth={2}
              />
            </g>
          );
        })}

        {labels.map(({ id, text, anchor = "start", dy = 0 }) => {
          const { cx, cy } = at(id);
          return (
            <text
              key={id}
              x={cx + (anchor === "start" ? 12 : -12)}
              y={cy + dy}
              dy="0.32em"
              textAnchor={anchor}
              className="pointer-events-none fill-ink-2 text-[12px]"
            >
              {text}
            </text>
          );
        })}
      </svg>

      {hovered && (
        <div
          className={`pointer-events-none absolute z-10 w-max max-w-[240px] -translate-x-1/2 border border-line bg-paper px-3 py-2 font-mono text-xs text-ink-2 shadow-sm ${
            y(passRate(hovered)) < H / 2 ? "translate-y-[14px]" : "-translate-y-[calc(100%+14px)]"
          }`}
          style={{
            left: `${(x(hovered.costPerAttempt!) / W) * 100}%`,
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
          <p className="m-0">
            {usd(hovered.costPerAttempt)}/attempt · {Math.round(hovered.costCoverage * 100)}% costed
          </p>
        </div>
      )}
    </div>
  );
}
