import type { Metadata } from "next";
import Link from "next/link";
import { benchmarksHref, contactHref, researchHref, wharfSweHref } from "@/lib/site";
import { CostQualityChart } from "@/components/CostQualityChart";
import { ConsistencyChart } from "@/components/wharf/ConsistencyChart";
import { Glance, glanceConsistencyPair } from "@/components/wharf/Glance";
import { DeepSweTable } from "@/components/wharf/ResultTables";
import { WharfSwitcher } from "@/components/wharf/WharfSwitcher";
import { sweRuns, wharfSweTaskCount } from "@/content/wharf-swe";
import {
  guidancePairs,
  metaComparisons,
  metaSource,
  passRate,
  pct,
  range95,
  run,
  runs,
  taskCount,
  totalPlanned,
  usd,
  wharfCommit,
  wharfDate,
  wharfSource,
} from "@/content/wharf";
import { pairedDiff, signed } from "@/content/wharf-stats";
import {
  ArrowLink,
  AutoGrid,
  Container,
  CtaStrip,
  DarkBand,
  Eyebrow,
  H2,
  PageHero,
  StatGrid,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Wharf: DeepSWE Coding-Agent Research",
  description:
    "What repeated coding-agent trials show about harnesses, cost, regressions and reliability.",
};

const opusCopilot = run("copilot-claude-opus-5-max-1.0.77");
const opusClaudeCode = run("cc-claude-opus-5-max-2.1.220");
const luna = run("copilot-gpt-5.6-luna-max-1.0.77");
const lunaNext = run("copilot-gpt-5.6-luna-max-1.0.91");
const opus55 = run("copilot-claude-opus-5.5-max-1.0.95");
const hydra = run("copilot-hydrafusion-default-1.0.105");
const [hydraRun1, hydraRun2] = [run("copilot-hydrafusion-max-1.0.95"), run("copilot-hydrafusion-max-1.0.95-all-2")];

const lunaGap = pairedDiff(lunaNext.id, luna.id);
const range = (d: { lo: number; hi: number }) => `${signed(d.lo)} to ${signed(d.hi)}`;

const guidance = guidancePairs.map(({ base, guided }) => ({ base, guided, change: pairedDiff(base.id, guided.id) }));
const metaGap = (c: (typeof metaComparisons)[number]) => (passRate(c.run) - c.meta) * 100;
const sameHarness = metaComparisons.filter((c) => c.run.harness === c.metaHarness);
const maxSameGap = Math.max(...sameHarness.map((c) => Math.abs(metaGap(c))));

const example = [
  ["Login", "Pass", "Pass"],
  ["Tax calculation", "Fail", "Pass"],
  ["Database", "Fail", "Fail"],
  ["File upload", "Pass", "Fail"],
  ["Search", "Fail", "Pass"],
];

const metrics = [
  { label: "ATTEMPT PASS RATE", value: "50% — 5 of 10 attempts" },
  { label: "TASKS SOLVED", value: "80% — 4 of 5 tasks, at least once" },
  { label: "COST PER PASSING ATTEMPT", value: "$0.80 — $4 ÷ 5 passes" },
  { label: "COST PER TASK SOLVED", value: "$1.00 — $4 ÷ 4 tasks" },
];

const method = [
  ["01", "Fixed task set", `${taskCount} DeepSWE tasks, 4–5 planned attempts each. Every planned attempt stays in the denominator — an attempt that never ran counts as a failure.`],
  ["02", "Isolated agent run", "Each attempt runs in its own clean environment. The agent's only output is a patch."],
  ["03", "Independent verifier", "A separate environment applies the patch and runs the task's tests. An attempt passes only on a positive verifier result. An agent that runs out of time is still graded on the patch it left."],
  ["04", "Regression check", "Pre-existing tests run too. Breaking them is recorded separately, not hidden inside the pass rate."],
  ["05", "Evidence retained", "Patches, logs, agent trajectories, verifier output, timing, token usage and cost — for every attempt."],
];

const limitations = [
  `These results describe ${taskCount} open-source coding tasks. Your workload may rank the same configurations differently — that's the point of testing on it.`,
  "Harness comparisons change more than one thing at once: the harness release, its prompts and its tools all differ.",
  `A single run is a sample. Two HydraFusion runs on the same release scored ${pct(passRate(hydraRun1))} and ${pct(passRate(hydraRun2))}. Most results between 69% and 75% sit inside each other's 95% ranges, so read the top of the table as a group, not a ranking. The ranges treat the task, not the attempt, as the unit, because attempts on one task are correlated.`,
  `These runs don't isolate harness releases from run-to-run variation: Luna scored ${pct(passRate(luna))} and ${pct(passRate(lunaNext))} on Copilot ${luna.version} and ${lunaNext.version}, a gap whose 95% range (${range(lunaGap)} points) includes zero.`,
  `Cost is missing for some attempts — ${Math.round((1 - opus55.costCoverage) * 100)}% of the Opus 5.5 run and all of the Muse Spark run. Missing costs are excluded from averages, never counted as zero.`,
  "Regression counts cover attempts where existing tests could be measured. Unmeasured is unknown, not clean.",
  `Models and harnesses ship monthly. This is a snapshot from ${wharfDate}.`,
];

export default function WharfResearchPage() {
  return (
    <>
      <WharfSwitcher active={researchHref} />
      <PageHero
        eyebrow="Research — Wharf / DeepSWE"
        title={`What ${totalPlanned.toLocaleString("en-US")} planned coding-agent attempts reveal.`}
        lede={`Wharf is our benchmark platform for AI coding agents: real software tasks, repeated attempts, and an independent verifier. These results cover the models and harnesses tested in ${wharfDate}. Missing attempts count as failures.`}
        aside={
          <StatGrid
            items={[
              { label: "TASKS", value: String(taskCount) },
              { label: "CONFIGURATIONS", value: String(runs.length) },
              { label: "PLANNED ATTEMPTS", value: totalPlanned.toLocaleString("en-US") },
              { label: "PLANNED PER TASK / CONFIG", value: "4–5" },
            ]}
          />
        }
      />

      <section className="border-t border-line bg-surface">
        <Container className="flex flex-col gap-12 py-26">
          <div className="flex flex-col gap-4">
            <Eyebrow>At a glance</Eyebrow>
            <H2>Six things a leaderboard doesn&apos;t show.</H2>
          </div>
          <Glance />
        </Container>
      </section>

      <section id="results" className="border-t border-line">
        <Container className="flex flex-col gap-10 py-26">
          <div className="flex flex-col gap-4">
            <Eyebrow>Results</Eyebrow>
            <H2>Which configurations offer the most for their cost?</H2>
            <p className="m-0 max-w-[60ch] text-ink-2">
              Each dot is a model, harness release and reasoning effort. Switch between cost
              and duration to see which configurations reach each pass rate with the least
              spending or agent time.
            </p>
          </div>
          <figure className="m-0 flex flex-col gap-3">
            <div className="border border-line bg-surface p-4">
              <CostQualityChart
                runs={runs}
                pair={[opusCopilot.id, opusClaudeCode.id]}
                labels={[
                  { id: luna.id, text: "GPT-5.6 Luna · 1.0.77", anchor: "end" },
                  { id: lunaNext.id, text: "GPT-5.6 Luna · 1.0.91", dy: 12 },
                  { id: hydra.id, text: `HydraFusion · ${hydra.version}` },
                  { id: "copilot-gpt-6-luna-max-1.0.91", text: "GPT-6 Luna · 1.0.91", anchor: "end" },
                  { id: "copilot-gpt-6-luna-default-1.0.105", text: "GPT-6 Luna · 1.0.105", dy: 14 },
                  { id: opusCopilot.id, text: "Opus 5 · Copilot", anchor: "end" },
                  { id: opusClaudeCode.id, text: "Opus 5 · Claude Code", anchor: "end" },
                ]}
              />
            </div>
            <figcaption className="font-mono text-xs text-muted">
              Muse Spark appears in the Duration view because no cost was recorded. Hover or tab
              through the dots for details and each run&apos;s 95% range.
            </figcaption>
          </figure>
          <DeepSweTable
            definitions={
              <>
                pass@1 = passing attempts ÷ planned attempts. 95% range = ±1.96 task-clustered
                standard errors, in points. Broke tests = attempts where at least one pre-existing
                test failed. $/attempt = mean over attempts with cost data. Runs with an added
                guidance pack are reported separately below. Select a column header to sort.
              </>
            }
            source={
              <>
                Source:{" "}
                <a href={wharfSource} className="underline hover:text-ink">
                  Wharf @ {wharfCommit}
                </a>
              </>
            }
          />
        </Container>
      </section>

      <section id="consistency" className="border-t border-line bg-surface">
        <Container className="flex flex-col gap-10 py-26">
          <div className="flex max-w-[64ch] flex-col gap-4">
            <Eyebrow>Consistency</Eyebrow>
            <H2>Same score, different behaviour.</H2>
            <p className="m-0 text-ink-2">
              A pass rate averages over every attempt. Split it by task and runs with the same score
              look different. {hydra.model} on {hydra.version} and GPT-5.6 Luna on {luna.version} both
              pass about 74%. HydraFusion solves {hydra.tasksAllPass} tasks on every attempt and never
              solves {hydra.tasksNoPass}. Luna solves only {luna.tasksAllPass} every time, but misses
              just {luna.tasksNoPass} completely.
            </p>
            <p className="m-0 text-ink-2">
              For unattended automation, the dark segment is what you can rely on. With a person who
              can retry, the lightest segment is what&apos;s left out of reach.
            </p>
          </div>
          <ConsistencyChart highlight={glanceConsistencyPair} />
        </Container>
      </section>

      <section id="meta" className="border-t border-line">
        <Container className="flex flex-col gap-10 py-26">
          <div className="flex max-w-[64ch] flex-col gap-4">
            <Eyebrow>External check</Eyebrow>
            <H2>Our numbers match Meta&apos;s.</H2>
            <p className="m-0 text-ink-2">
              Meta published DeepSWE 1.1 results with its Muse Spark 1.2 launch. Like us, it runs
              each model in that model&apos;s own agent product, five attempts per task, on its own
              infrastructure. On both configurations we share, our pass rate is within{" "}
              {maxSameGap.toFixed(1)} points of Meta&apos;s, or three to four passes in 565 attempts.
            </p>
            <p className="m-0 text-ink-2">
              That&apos;s well inside the run-to-run variation either evaluation would show, and it
              means the harness gaps on this page aren&apos;t artefacts of how we run or grade tasks.
            </p>
            <div>
              <ArrowLink href={metaSource}>Meta&apos;s published results</ArrowLink>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <DataTable
              head={["configuration", "Wharf", "Meta", "difference", "Wharf 95% range"]}
              rows={metaComparisons.map((c) => [
                `${c.run.model} · ${c.run.harness === c.metaHarness ? c.run.harness : `${c.run.harness} (Meta: ${c.metaHarness})`}`,
                pct(passRate(c.run)),
                pct(c.meta),
                `${signed(metaGap(c))} pts`,
                `${pct(passRate(c.run) - range95(c.run) / 100)}–${pct(passRate(c.run) + range95(c.run) / 100)}`,
              ])}
            />
            <p className="m-0 font-mono text-xs text-muted">
              Meta publishes overall rates only, with no per-task results, so this is an unpaired
              check rather than a replication. GPT-5.6 Terra ran in Copilot for us and in Codex for
              Meta, so that row also compares two harnesses. Meta&apos;s figure falls inside our 95%
              range on all three.
            </p>
          </div>
        </Container>
      </section>

      <section id="guidance" className="border-t border-line">
        <Container className="flex flex-col gap-10 py-26">
          <div className="flex max-w-[64ch] flex-col gap-4">
            <Eyebrow>Added guidance</Eyebrow>
            <H2>A guidance pack made all three models worse.</H2>
            <p className="m-0 text-ink-2">
              We reran three Copilot configurations with Microsoft&apos;s open-source{" "}
              <a href="https://github.com/microsoft/hve-core" className="underline hover:text-ink">
                HVE Core
              </a>{" "}
              instructions and skills copied into the agent&apos;s configuration, with nothing else
              changed. Pass rates fell for all three. Each drop&apos;s 95% range stays below zero,
              though only just for Claude Opus 5.
            </p>
          </div>
          <DataTable
            head={["model", "without", "with HVE Core", "change (95% range)", "agent time", "$/attempt"]}
            rows={guidance.map(({ base, guided, change }) => [
              `${base.model} · ${base.harness} ${base.version}`,
              pct(passRate(base)),
              pct(passRate(guided)),
              `${signed(change.diff)} pts (${range(change)})`,
              `${Math.round(base.agentSeconds / 60)} → ${Math.round(guided.agentSeconds / 60)} min`,
              `${usd(base.costPerAttempt)} → ${usd(guided.costPerAttempt)}`,
            ])}
          />
          <p className="m-0 max-w-[80ch] font-mono text-xs text-muted">
            Change compares each task&apos;s pass rate with and without guidance, so tasks that are hard
            either way cancel out. GPT-5.6 Terra&apos;s plain run had five attempts per task and its HVE
            run four. This is one guidance pack on one benchmark: it says to measure guidance before
            rolling it out, not that guidance can&apos;t help.
          </p>
        </Container>
      </section>

      <section className="border-t border-line bg-ink text-night-text">
        <Container className="flex flex-wrap items-end justify-between gap-8 py-16">
          <div className="flex max-w-[60ch] flex-col gap-3">
            <Eyebrow dark>Same method, our own code — WharfSWE</Eyebrow>
            <p className="m-0 font-display text-[clamp(26px,3vw,36px)] leading-[1.1] text-paper">
              {sweRuns.length} more runs on .NET code, cheap enough to repeat on every Copilot release.
            </p>
            <p className="m-0 text-night-muted">
              The same task format, runner and verifier, on {wharfSweTaskCount} C# tasks rebuilt from
              Wharf&apos;s own release history — enterprise-style .NET code that DeepSWE doesn&apos;t cover.
            </p>
          </div>
          <Link
            href={wharfSweHref}
            className="inline-flex min-h-12 items-center bg-accent px-[22px] font-medium text-white transition-colors hover:bg-paper hover:text-ink"
          >
            See the WharfSWE results →
          </Link>
        </Container>
      </section>

      <section className="border-t border-line bg-surface">
        <Container className="py-26">
          <AutoGrid min={340} className="items-start gap-14">
            <div className="flex flex-col gap-4">
              <Eyebrow>Reading the numbers</Eyebrow>
              <H2>A pass rate is only the beginning.</H2>
              <p className="m-0 text-ink-2">
                Take five tasks, two attempts each, $4 of compute in total. The same results give
                four different answers depending on the question you ask.
              </p>
              <details className="border-t border-line pt-4 text-ink-2">
                <summary className="cursor-pointer font-medium text-ink">
                  Aren&apos;t repeated attempts just retries?
                </summary>
                <p className="m-0 mt-3">
                  No. A production retry usually stops at the first success; a benchmark runs every
                  planned attempt to measure consistency. And an infrastructure retry — re-running
                  because a container died — is not a new model attempt at all. We count the three
                  separately.
                </p>
              </details>
            </div>
            <div className="flex flex-col gap-6">
              <div className="overflow-x-auto border border-line bg-paper">
                <table className="w-full border-collapse font-mono text-[13px]">
                  <thead>
                    <tr className="text-left text-muted">
                      {["task", "attempt 1", "attempt 2"].map((h) => (
                        <th key={h} className="border-b border-line px-3 py-2.5 font-normal">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {example.map(([task, ...attempts]) => (
                      <tr key={task}>
                        <td className="border-b border-line px-3 py-2.5 text-ink">{task}</td>
                        {attempts.map((a, i) => (
                          <td
                            key={i}
                            className={`border-b border-line px-3 py-2.5 ${a === "Pass" ? "text-ink" : "text-muted"}`}
                          >
                            {a === "Pass" ? "✓ pass" : "✗ fail"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <StatGrid items={metrics.map((m) => ({ ...m, small: true }))} tone="paper" />
            </div>
          </AutoGrid>
        </Container>
      </section>

      <DarkBand>
        <Container className="py-26">
          <AutoGrid min={320} className="items-start gap-14">
            <div className="flex flex-col gap-4">
              <Eyebrow dark>Methodology</Eyebrow>
              <H2 dark>The agent doesn&apos;t grade its own homework.</H2>
              <p className="m-0 text-night-muted">
                Implementation and verification are separate, so a claimed fix and a verified fix
                can never be confused.
              </p>
            </div>
            <ol className="m-0 flex list-none flex-col border-b border-night-line p-0">
              {method.map(([n, title, body]) => (
                <li key={n} className="grid grid-cols-[48px_1fr] gap-3 border-t border-night-line py-[18px]">
                  <span className="font-mono text-[15px] text-accent-soft">{n}</span>
                  <div>
                    <p className="m-0 font-medium text-paper">{title}</p>
                    <p className="m-0 mt-1 text-night-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </AutoGrid>
        </Container>
      </DarkBand>

      <Container className="py-26">
        <AutoGrid min={320} className="items-start gap-14">
          <div className="flex flex-col gap-4">
            <Eyebrow>Limitations</Eyebrow>
            <H2>What these results don&apos;t tell you.</H2>
            <div className="flex flex-col items-start">
              <ArrowLink href={wharfSource}>Code, raw data &amp; methodology on GitHub</ArrowLink>
              <ArrowLink href={benchmarksHref}>How other benchmarks compare, in our benchmark directory</ArrowLink>
            </div>
          </div>
          <ul className="m-0 flex list-none flex-col border-b border-line p-0">
            {limitations.map((l) => (
              <li key={l} className="border-t border-line py-[18px] text-ink-2">
                {l}
              </li>
            ))}
          </ul>
        </AutoGrid>
      </Container>

      <CtaStrip
        title="Find out how these models do on your tasks."
        href={contactHref}
        label="Request a discovery call"
      />
    </>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto border border-line bg-paper">
      <table className="w-full border-collapse font-mono text-[13px] tabular-nums">
        <thead>
          <tr className="text-left text-muted">
            {head.map((h, i) => (
              <th key={h} scope="col" className={`border-b border-line px-3 py-2.5 font-normal whitespace-nowrap ${i > 0 ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-ink-2">
          {rows.map((cells) => (
            <tr key={cells[0]}>
              {cells.map((c, i) => (
                <td key={i} className={`border-b border-line px-3 py-2.5 whitespace-nowrap ${i === 0 ? "text-ink" : "text-right"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
