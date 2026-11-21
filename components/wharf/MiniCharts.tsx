import type { ReactNode } from "react";
import {
  costPerPass,
  guidancePairs,
  metaComparisons,
  passRate,
  pct,
  run,
  runs,
  taskCount,
  tasksMixed,
  usd,
  type WharfRun,
} from "@/content/wharf";
import { pairedDiff, signed } from "@/content/wharf-stats";

/*
 * "At a glance": the page's headline findings, each as one big number, one sentence and a small
 * chart that makes the point without reading. Server-rendered; every figure comes from the data.
 */

const opusCopilot = run("copilot-claude-opus-5-max-1.0.77");
const opusClaudeCode = run("cc-claude-opus-5-max-2.1.220");
const luna = run("copilot-gpt-5.6-luna-max-1.0.77");
const hydra = run("copilot-hydrafusion-default-1.0.105");
const astra = run("copilot-gpt-6-astra-max-1.0.91");

/** Runs in the consistency comparison, also highlighted in the full chart further down. */
export const glanceConsistencyPair = [hydra.id, luna.id];

export function Glance() {
  const harness = pairedDiff(opusClaudeCode.id, opusCopilot.id);
  const tokenRatio = opusClaudeCode.inputTokens! / opusCopilot.inputTokens!;
  const costSaving = 1 - opusCopilot.costPerAttempt! / opusClaudeCode.costPerAttempt!;

  const costed = runs.flatMap((r) => {
    const c = costPerPass(r);
    return c === null ? [] : [{ r, c }];
  });
  const cheapest = costed.reduce((a, b) => (b.c < a.c ? b : a));
  const dearest = costed.reduce((a, b) => (b.c > a.c ? b : a));
  const lunaPerPass = costPerPass(luna)!;

  const guidance = guidancePairs.map((p) => ({ ...p, change: pairedDiff(p.base.id, p.guided.id) }));
  const drops = guidance.map((g) => -g.change.diff);
  const sameHarnessMeta = metaComparisons.filter((c) => c.run.harness === c.metaHarness);
  const metaGap = Math.max(...sameHarnessMeta.map((c) => Math.abs(passRate(c.run) - c.meta) * 100));

  const short = (r: WharfRun) => r.model.replace("Claude ", "");

  return (
    <div className="m-0 grid list-none grid-cols-1 gap-px border border-line bg-line p-0 md:grid-cols-2 xl:grid-cols-3">
      <Card
        tag="01 · harness"
        big={`${signed(harness.diff)} pts`}
        title="Same model, better harness, lower bill."
        href="#results"
        chart={
          <Strip
            min={0.6}
            max={0.76}
            ticks={[0.6, 0.65, 0.7, 0.75]}
            format={(t) => `${Math.round(t * 100)}%`}
            rows={[
              {
                connect: true,
                points: [
                  { v: passRate(opusClaudeCode), kind: "faint", label: "Claude Code", anchor: "end" },
                  { v: passRate(opusCopilot), kind: "accent", label: "Copilot", anchor: "start" },
                ],
              },
            ]}
            title={`Claude Opus 5: ${pct(passRate(opusClaudeCode))} in Claude Code, ${pct(passRate(opusCopilot))} in Copilot`}
          />
        }
      >
        Claude Opus 5 passed {pct(passRate(opusCopilot))} in Copilot and {pct(passRate(opusClaudeCode))} in
        Claude Code (95% range of the gap: {signed(harness.lo)} to {signed(harness.hi)} pts), at{" "}
        {Math.round(costSaving * 100)}% lower cost. Claude Code read {tokenRatio.toFixed(1)}× more input tokens
        per attempt.
      </Card>

      <Card
        tag="02 · cost"
        big={`${Math.round(dearest.c / cheapest.c)}×`}
        title="The spread in what one fix costs."
        href="#cost"
        chart={
          <Strip
            log
            min={0.1}
            max={30}
            ticks={[0.1, 1, 10]}
            format={(t) => `$${t}`}
            rows={[
              {
                points: costed.map(({ r, c }) => ({
                  v: c,
                  kind: r.id === luna.id ? ("accent" as const) : r.id === cheapest.r.id || r.id === dearest.r.id ? ("ink" as const) : ("faint" as const),
                  label: r.id === cheapest.r.id || r.id === dearest.r.id ? usd(c) : undefined,
                  anchor: "middle" as const,
                  above: true,
                })),
              },
            ]}
            title={`Cost per passing attempt, from ${usd(cheapest.c)} to ${usd(dearest.c)}`}
          />
        }
      >
        Cost per passing attempt runs from {usd(cheapest.c)} ({cheapest.r.model}) to {usd(dearest.c)} (
        {short(dearest.r)}, {dearest.r.harness}). GPT-5.6 Luna (copper), among the top scorers, costs{" "}
        {usd(lunaPerPass)}.
      </Card>

      <Card
        tag="03 · consistency"
        big={`${hydra.tasksAllPass} vs ${luna.tasksAllPass}`}
        title="Same score, different behaviour."
        href="#consistency"
        chart={
          <div className="flex flex-col gap-2.5" role="img" aria-label={`Tasks solved every attempt: ${hydra.model} ${hydra.tasksAllPass}, ${luna.model} ${luna.tasksAllPass}, out of ${taskCount}`}>
            {[hydra, luna].map((r) => (
              <div key={r.id} className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-ink-2">
                  {r.model} · {pct(passRate(r))}
                </span>
                <span className="flex h-3 gap-[2px]" aria-hidden>
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
            <span className="font-mono text-[11px] text-muted">every attempt · some · never</span>
          </div>
        }
      >
        Two runs both pass about 74%. HydraFusion solves {hydra.tasksAllPass} tasks every time; Luna{" "}
        {luna.tasksAllPass}, but Luna solves {taskCount - luna.tasksNoPass} at least once. Pick for dependability
        or for reach.
      </Card>

      <Card
        tag="04 · regressions"
        big={`${astra.regressions} vs ${opusCopilot.regressions}`}
        title="Passing the task isn't enough."
        href="#results"
        chart={
          <div className="flex flex-col gap-2.5" role="img" aria-label={`Attempts that broke existing tests: ${astra.model} ${astra.regressions}, Claude Opus 5 ${opusCopilot.regressions}`}>
            {[astra, opusCopilot].map((r) => (
              <div key={r.id} className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-ink-2">
                  {r.model} · {pct(passRate(r))} pass@1
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 rounded-r-[4px] bg-warn-soft" style={{ width: `${(r.regressions / 50) * 100}%` }} />
                  <span className="font-mono text-[11px] tabular-nums text-ink-2">{r.regressions}</span>
                </span>
              </div>
            ))}
            <span className="font-mono text-[11px] text-muted">attempts that broke existing tests</span>
          </div>
        }
      >
        GPT-6 Astra and Claude Opus 5 pass almost the same share of attempts. Astra&apos;s patches broke
        pre-existing tests twice as often.
      </Card>

      <Card
        tag="05 · guidance"
        big={`−${Math.min(...drops).toFixed(0)} to −${Math.max(...drops).toFixed(0)} pts`}
        title="A guidance pack made agents worse."
        href="#guidance"
        chart={
          <Strip
            min={0.55}
            max={0.76}
            ticks={[0.55, 0.6, 0.65, 0.7, 0.75]}
            format={(t) => `${Math.round(t * 100)}%`}
            labelWidth={52}
            rows={guidance.map(({ base, guided }) => ({
              label: short(base).replace("GPT-5.6 ", ""),
              connect: true,
              points: [
                { v: passRate(base), kind: "ring" as const },
                { v: passRate(guided), kind: "accent" as const },
              ],
            }))}
            title="Pass rate without and with HVE Core guidance"
          />
        }
      >
        Adding Microsoft&apos;s HVE Core instructions and skills lowered the pass rate for all three models we
        tried it on. Ring: without. Dot: with HVE Core.
      </Card>

      <Card
        tag="06 · external check"
        big={`≤${metaGap.toFixed(1)} pts`}
        title="Our numbers match Meta's."
        href="#meta"
        chart={
          <Strip
            min={0.55}
            max={0.7}
            ticks={[0.55, 0.6, 0.65, 0.7]}
            format={(t) => `${Math.round(t * 100)}%`}
            labelWidth={52}
            rows={sameHarnessMeta.map((c) => ({
              label: short(c.run).split(" ")[0],
              points: [
                { v: c.meta, kind: "ring" as const },
                { v: passRate(c.run), kind: "ink" as const },
              ],
            }))}
            title="Wharf (dot) against Meta's published result (ring)"
          />
        }
      >
        On the two configurations we share, our pass rate is within {metaGap.toFixed(1)} points of Meta&apos;s
        independently run, published DeepSWE results. Dot: Wharf. Ring: Meta.
      </Card>
    </div>
  );
}

function Card({
  tag,
  big,
  title,
  chart,
  href,
  children,
}: {
  tag: string;
  big: string;
  title: string;
  chart: ReactNode;
  href: string;
  children: ReactNode;
}) {
  return (
    <article className="flex flex-col gap-4 bg-surface p-7">
      <span className="font-mono text-[13px] text-accent-ink">{tag}</span>
      <div className="flex flex-col gap-1">
        <p className="m-0 font-display text-[44px] leading-none tracking-[-0.02em] text-ink">{big}</p>
        <h3 className="m-0 text-[19px] font-semibold">{title}</h3>
      </div>
      <div className="min-h-[76px]">{chart}</div>
      <p className="m-0 text-[15px] text-ink-2">{children}</p>
      <a href={href} className="mt-auto font-mono text-xs text-muted hover:text-ink">
        See the detail →
      </a>
    </article>
  );
}

type Point = {
  v: number;
  kind: "accent" | "ink" | "faint" | "ring";
  label?: string;
  anchor?: "start" | "middle" | "end";
  /** Put the label above the dot instead of below. */
  above?: boolean;
};

/** Dots on a shared horizontal scale, one row per series; a rule joins a row's dots when `connect`. */
function Strip({
  rows,
  min,
  max,
  ticks,
  format,
  log = false,
  labelWidth = 0,
  title,
}: {
  rows: { label?: string; connect?: boolean; points: Point[] }[];
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
