"use client";

import { useState } from "react";
import { harnessLabel, type HarnessKey, type SweRun } from "@/content/wharf-swe";

/* One row per model; one dot per harness at its pass rate; a rule spans the gap. */

export const harnessColor: Record<HarnessKey, string> = {
  "copilot-cli": "var(--color-series-1)",
  claude: "var(--color-series-2)",
  codex: "var(--color-series-3)",
};
const harnessOrder: HarnessKey[] = ["copilot-cli", "claude", "codex"];

const W = 720;
const rowH = 64;
const pad = { top: 16, right: 40, bottom: 44, left: 150 };
const xMin = 0.65;
const xMax = 1;
const ticks = [0.7, 0.8, 0.9, 1];

const x = (rate: number) => pad.left + ((rate - xMin) / (xMax - xMin)) * (W - pad.left - pad.right);

export function HarnessDumbbell({ rows }: { rows: { model: string; runs: SweRun[] }[] }) {
  const [active, setActive] = useState<string | null>(null);
  const H = pad.top + rows.length * rowH + pad.bottom;
  const all = rows.flatMap((r) => r.runs);
  const hovered = all.find((r) => r.id === active);
  const hoveredRow = rows.findIndex((r) => r.runs.some((p) => p.id === active));
  const used = harnessOrder.filter((h) => all.some((r) => r.harness === h));

  return (
    <div className="flex flex-col gap-4">
      <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 font-mono text-xs text-ink-2" aria-label="Legend">
        {used.map((h) => (
          <li key={h} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: harnessColor[h] }} aria-hidden />
            {harnessLabel[h]}
          </li>
        ))}
      </ul>
      <div className="relative min-w-[560px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full font-mono" role="img"
          aria-label="Dot plot of pass rate for the same model under different harnesses. Values are in the table below.">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={pad.top} y2={H - pad.bottom} className="stroke-line" />
              <text x={x(t)} y={H - pad.bottom + 22} textAnchor="middle" className="fill-muted text-[12px]">
                {Math.round(t * 100)}%
              </text>
            </g>
          ))}
          <text x={(pad.left + W - pad.right) / 2} y={H - 6} textAnchor="middle" className="fill-muted text-[12px]">
            pass@1 (axis starts at 65%) →
          </text>

          {rows.map((row, i) => {
            const cy = pad.top + i * rowH + rowH / 2;
            const rates = row.runs.map((r) => r.passes / r.trials);
            const lo = Math.min(...rates);
            const hi = Math.max(...rates);
            const gap = Math.round((hi - lo) * 1000) / 10;
            return (
              <g key={row.model}>
                <text x={pad.left - 16} y={cy} dy="0.32em" textAnchor="end" className="fill-ink font-sans text-[14px] font-medium">
                  {row.model}
                </text>
                <line x1={x(lo)} x2={x(hi)} y1={cy} y2={cy} className="stroke-field" strokeWidth={2} />
                {gap > 0 && (
                  <text x={(x(lo) + x(hi)) / 2} y={cy - 12} textAnchor="middle" className="fill-muted text-[11px]">
                    {gap} pts
                  </text>
                )}
                {row.runs.map((r) => {
                  const cx = x(r.passes / r.trials);
                  const on = active === r.id;
                  const focus = () => setActive(r.id);
                  const blur = () => setActive((cur) => (cur === r.id ? null : cur));
                  return (
                    <g key={r.id} tabIndex={0} role="button"
                      aria-label={`${row.model} on ${harnessLabel[r.harness]} ${r.version}: ${r.passes} of ${r.trials} passed, ${r.p2pErrors} broke tests`}
                      onPointerEnter={focus} onPointerLeave={blur} onFocus={focus} onBlur={blur}
                      className="cursor-default outline-none">
                      <circle cx={cx} cy={cy} r={14} fill="transparent" />
                      <circle cx={cx} cy={cy} r={on ? 9 : 7} fill={harnessColor[r.harness]} className="stroke-surface" strokeWidth={2} />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {hovered && (
          <div
            className={`pointer-events-none absolute z-10 w-max max-w-[240px] -translate-y-[calc(100%+14px)] border border-line bg-paper px-3 py-2 font-mono text-xs text-ink-2 shadow-sm ${
              x(hovered.passes / hovered.trials) / W > 0.7 ? "-translate-x-[calc(100%-14px)]" : "-translate-x-1/2"
            }`}
            style={{
              left: `${(x(hovered.passes / hovered.trials) / W) * 100}%`,
              top: `${((pad.top + hoveredRow * rowH + rowH / 2) / H) * 100}%`,
            }}
          >
            <p className="m-0 font-sans text-sm font-semibold text-ink">{hovered.model}</p>
            <p className="m-0">
              {harnessLabel[hovered.harness]} {hovered.version}
            </p>
            <p className="m-0 mt-1">
              {hovered.passes}/{hovered.trials} passed · {hovered.p2pErrors} broke tests
            </p>
            <p className="m-0">
              {hovered.costPerTrial !== null
                ? `$${hovered.costPerTrial.toFixed(4)}/trial`
                : hovered.apiEstimatePerTrial !== null
                  ? `~$${hovered.apiEstimatePerTrial.toFixed(4)}/trial (API estimate)`
                  : "no cost recorded"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
