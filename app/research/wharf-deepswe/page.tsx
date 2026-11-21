import type { Metadata } from "next";
import Link from "next/link";
import { benchmarksHref, contactHref, researchHref, wharfSweHref } from "@/lib/site";
import { CostQualityChart } from "@/components/CostQualityChart";
import { SectionNav } from "@/components/SectionNav";
import { ConsistencyChart } from "@/components/wharf/ConsistencyChart";
import { CostPerFix } from "@/components/wharf/CostPerFix";
import { DeepSweTaskHeatmap } from "@/components/wharf/DeepSweTaskHeatmap";
import { ConsistencyPair, Strip } from "@/components/wharf/MiniCharts";
import { DeepSweTable } from "@/components/wharf/ResultTables";
import { Aside, Finding, FindingsIndex, More } from "@/components/wharf/Story";
import { WharfSwitcher } from "@/components/wharf/WharfSwitcher";
import { sweRuns, wharfSweTaskCount } from "@/content/wharf-swe";
import {
  costPerPass,
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
  type WharfRun,
} from "@/content/wharf";
import { pairedDiff, passesByRun, signed, taskLanguages } from "@/content/wharf-stats";
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
const astra = run("copilot-gpt-6-astra-max-1.0.91");
const [hydraRun1, hydraRun2] = [run("copilot-hydrafusion-max-1.0.95"), run("copilot-hydrafusion-max-1.0.95-all-2")];

const short = (r: WharfRun) => r.model.replace("Claude ", "");
const range = (d: { lo: number; hi: number }) => `${signed(d.lo)} to ${signed(d.hi)}`;

/* ---------- finding 1: the harness ---------- */

const harnessGap = pairedDiff(opusClaudeCode.id, opusCopilot.id);
const tokenRatio = opusClaudeCode.inputTokens! / opusCopilot.inputTokens!;
const costSaving = 1 - opusCopilot.costPerAttempt! / opusClaudeCode.costPerAttempt!;

const guidance = guidancePairs.map(({ base, guided }) => ({ base, guided, change: pairedDiff(base.id, guided.id) }));
const drops = guidance.map((g) => -g.change.diff);

/* ---------- finding 2: beyond the score ---------- */

const fixCosts = runs.flatMap((r) => (costPerPass(r) === null ? [] : [{ r, c: costPerPass(r)! }]));
const cheapestFix = fixCosts.reduce((a, b) => (b.c < a.c ? b : a));
const dearestFix = fixCosts.reduce((a, b) => (b.c > a.c ? b : a));
const underDollar = fixCosts.filter((x) => x.c < 1).length;
const fixSpread = Math.round(dearestFix.c / cheapestFix.c);

/* ---------- finding 3: your tasks ---------- */

// Task-by-configuration grid: per-task passes for every main run, best pass rate first.
const heatRuns = [...runs].sort((a, b) => passRate(b) - passRate(a));
const taskIds = Object.keys(taskLanguages);
const heatTasks = taskIds.map((id) => ({
  id,
  language: taskLanguages[id],
  mean: heatRuns.reduce((sum, r) => sum + (passesByRun[r.id][id] ?? 0) / r.attemptsPerTask, 0) / heatRuns.length,
}));
const heatRows = heatRuns.map((r) => ({
  id: r.id,
  label: r.model,
  sub: r.harness === "Copilot" ? r.version : `${r.harness} ${r.version}`,
  attempts: r.attemptsPerTask,
  passes: taskIds.map((id) => passesByRun[r.id][id] ?? 0),
}));
const fullBySome = taskIds.filter((id) => heatRuns.some((r) => passesByRun[r.id][id] === r.attemptsPerTask)).length;
const reachedByAll = taskIds.filter((id) => heatRuns.every((r) => (passesByRun[r.id][id] ?? 0) > 0)).length;
const hardest = [...heatTasks].sort((a, b) => a.mean - b.mean)[0];
const hardestReach = heatRuns.filter((r) => (passesByRun[r.id][hardest.id] ?? 0) > 0).length;

/* ---------- trust ---------- */

const metaGap = (c: (typeof metaComparisons)[number]) => (passRate(c.run) - c.meta) * 100;
const sameHarness = metaComparisons.filter((c) => c.run.harness === c.metaHarness);
const maxSameGap = Math.max(...sameHarness.map((c) => Math.abs(metaGap(c))));
const lunaGap = pairedDiff(lunaNext.id, luna.id);

const findings = [
  {
    id: "harness",
    title: "The harness changes the result, not just the model.",
    body: `The same model scored ${Math.abs(harnessGap.diff).toFixed(0)} points apart in two agent products — and the higher score was the cheaper one.`,
  },
  {
    id: "beyond-score",
    title: "Equal scores can hide very different buys.",
    body: `What one fix costs varies ${fixSpread}×. Runs with the same pass rate differ in consistency and in what they break.`,
  },
  {
    id: "tasks",
    title: "The best configuration depends on your tasks.",
    body: `Only ${reachedByAll} of ${taskCount} tasks were solved by every configuration. The top of the table is a tie, not a ranking.`,
  },
];

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
  `A single run is a sample. Two HydraFusion runs on the same release scored ${pct(passRate(hydraRun1))} and ${pct(passRate(hydraRun2))}. The ranges treat the task, not the attempt, as the unit, because attempts on one task are correlated.`,
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
        title="A leaderboard score won't choose your coding agent."
        lede={`We ran ${runs.length} coding-agent configurations — model, harness and reasoning effort — on ${taskCount} real software tasks: ${totalPlanned.toLocaleString("en-US")} planned attempts, each graded by an independent verifier. Three findings matter to anyone choosing one.`}
        aside={<FindingsIndex findings={findings} />}
      />

      <SectionNav
        links={[
          { id: "harness", label: "1 · The harness" },
          { id: "beyond-score", label: "2 · Beyond the score" },
          { id: "tasks", label: "3 · Your tasks" },
          { id: "method", label: "Why trust this" },
          { id: "results", label: "All results" },
          { id: "limitations", label: "Limitations" },
        ]}
      />

      {/* ---------- 1 ---------- */}
      <Finding
        id="harness"
        n={1}
        of={3}
        tone="surface"
        title={findings[0].title}
        stat={`${signed(harnessGap.diff)} pts`}
        statLabel={
          <>
            Claude Opus 5 in Copilot over Claude Code, at {Math.round(costSaving * 100)}% lower cost per attempt.
          </>
        }
        intro={
          <>
            <p>
              A coding agent is a model inside a harness: the product that hands it files, a terminal and
              instructions. Claude Opus 5 passed {pct(passRate(opusCopilot))} of attempts in Copilot and{" "}
              {pct(passRate(opusClaudeCode))} in Claude Code (95% range of the gap: {range(harnessGap)} points).
              Claude Code read {tokenRatio.toFixed(1)}× more input tokens per attempt.
            </p>
            <p>
              So the question isn&apos;t only &ldquo;which model?&rdquo; but &ldquo;which model, in which
              harness, at which release?&rdquo; The chart puts every configuration we ran on one page: higher
              is more tasks passed, further left is cheaper.
            </p>
          </>
        }
      >
        <figure className="m-0 flex flex-col gap-3">
          <div className="border border-line bg-paper p-4">
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
            Each dot is one model, harness release and reasoning effort. Switch to Duration to compare agent
            time instead; Muse Spark appears only there, because no cost was recorded. Hover or tab through the
            dots for details and each run&apos;s 95% range.
          </figcaption>
        </figure>

        <Aside title="Adding to the harness can make it worse.">
          <AutoGrid min={320} className="items-center gap-10">
            <p className="m-0 max-w-[60ch] text-ink-2">
              We reran three Copilot configurations with Microsoft&apos;s open-source{" "}
              <a href="https://github.com/microsoft/hve-core" className="underline hover:text-ink">
                HVE Core
              </a>{" "}
              instructions and skills copied into the agent&apos;s configuration, with nothing else changed.
              All three got worse, by {Math.min(...drops).toFixed(0)} to {Math.max(...drops).toFixed(0)} points.
              It&apos;s one guidance pack on one benchmark — a reason to measure guidance before rolling it
              out, not proof that guidance can&apos;t help.
            </p>
            <div className="flex flex-col gap-2">
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
              <p className="m-0 font-mono text-xs text-muted">Ring: without. Copper: with HVE Core.</p>
            </div>
          </AutoGrid>
          <More summary="The three guidance runs in detail">
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
            <p className="m-0 font-mono text-xs text-muted">
              Change compares each task&apos;s pass rate with and without guidance, so tasks that are hard
              either way cancel out. Each drop&apos;s 95% range stays below zero, though only just for Claude
              Opus 5. GPT-5.6 Terra&apos;s plain run had five attempts per task and its HVE run four.
            </p>
          </More>
        </Aside>
      </Finding>

      {/* ---------- 2 ---------- */}
      <Finding
        id="beyond-score"
        n={2}
        of={3}
        title={findings[1].title}
        stat={`${fixSpread}×`}
        statLabel={
          <>
            Spread in what one verified fix costs: {usd(cheapestFix.c)} to {usd(dearestFix.c)}.
          </>
        }
        intro={
          <>
            <p>
              A pass rate counts passing attempts. It doesn&apos;t say what each pass cost, whether you&apos;d
              get it every time, or what else the patch broke. Those three questions can separate
              configurations the leaderboard calls equal.
            </p>
          </>
        }
      >
        <More summary="New to these measures? How one set of results gives four different answers">
          <AutoGrid min={320} className="items-start gap-10">
            <div className="flex flex-col gap-3 text-ink-2">
              <p className="m-0">
                Take five tasks, two attempts each, $4 of compute in total. Depending on the question you ask,
                the same results give four answers.
              </p>
              <p className="m-0">
                Repeated attempts aren&apos;t retries. A production retry usually stops at the first success;
                a benchmark runs every planned attempt to measure consistency. An infrastructure retry —
                re-running because a container died — isn&apos;t a new model attempt at all. We count the
                three separately.
              </p>
            </div>
            <div className="flex flex-col gap-4">
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
              <StatGrid items={metrics.map((m) => ({ ...m, small: true }))} tone="surface" />
            </div>
          </AutoGrid>
        </More>

        <Aside title="Cost: divide by what passed, not by what ran.">
          <p className="m-0 max-w-[64ch] text-ink-2">
            Cost per attempt hides how often an attempt works. Per verified fix, the range runs from{" "}
            {usd(cheapestFix.c)} for {cheapestFix.r.model} to {usd(dearestFix.c)} for {dearestFix.r.model} in{" "}
            {dearestFix.r.harness}; {underDollar} of {fixCosts.length} configurations cost under a dollar. The
            harness from Finding 1 shows up again: Claude Opus 5 costs {usd(costPerPass(opusCopilot))} per fix in
            Copilot and {usd(costPerPass(opusClaudeCode))} in Claude Code.
          </p>
          <CostPerFix
            highlight={[opusCopilot.id, opusClaudeCode.id]}
            highlightNote="Copper bars: Claude Opus 5 in Copilot and in Claude Code."
          />
        </Aside>

        <Aside title="Consistency: same score, different behaviour.">
          <AutoGrid min={320} className="items-center gap-10">
            <div className="flex max-w-[60ch] flex-col gap-3 text-ink-2">
              <p className="m-0">
                {hydra.model} and GPT-5.6 Luna both pass about 74% of attempts. {hydra.model} solves{" "}
                {hydra.tasksAllPass} tasks every time and never solves {hydra.tasksNoPass}. Luna solves only{" "}
                {luna.tasksAllPass} every time, but misses just {luna.tasksNoPass} completely.
              </p>
              <p className="m-0">
                For unattended automation, the dark segment is what you can rely on. With a person who can
                retry, the light segment is what&apos;s out of reach.
              </p>
            </div>
            <ConsistencyPair runs={[hydra, luna]} />
          </AutoGrid>
          <More summary={`Compare all ${runs.length} configurations`}>
            <ConsistencyChart highlight={[hydra.id, luna.id]} />
          </More>
        </Aside>

        <Aside title="Breakage: passing the task isn't enough.">
          <AutoGrid min={320} className="items-center gap-10">
            <p className="m-0 max-w-[60ch] text-ink-2">
              {astra.model} and Claude Opus 5 pass almost the same share of attempts ({pct(passRate(astra))} and{" "}
              {pct(passRate(opusCopilot))}). {astra.model}&apos;s patches broke pre-existing tests{" "}
              {astra.regressions} times; Opus 5&apos;s, {opusCopilot.regressions}. Every configuration&apos;s count
              is in the full results.
            </p>
            <div
              className="flex flex-col gap-3"
              role="img"
              aria-label={`Attempts that broke existing tests: ${astra.model} ${astra.regressions}, Claude Opus 5 ${opusCopilot.regressions}`}
            >
              {[astra, opusCopilot].map((r) => (
                <div key={r.id} className="flex flex-col gap-1.5">
                  <span className="font-mono text-xs text-ink-2">
                    {r.model} · {pct(passRate(r))} pass rate
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-4 rounded-r-[4px] bg-warn-soft" style={{ width: `${(r.regressions / 50) * 100}%` }} />
                    <span className="font-mono text-xs tabular-nums text-ink-2">{r.regressions}</span>
                  </span>
                </div>
              ))}
              <span className="font-mono text-xs text-muted">attempts that broke existing tests</span>
            </div>
          </AutoGrid>
        </Aside>
      </Finding>

      {/* ---------- 3 ---------- */}
      <Finding
        id="tasks"
        n={3}
        of={3}
        tone="surface"
        title={findings[2].title}
        stat={`${reachedByAll} of ${taskCount}`}
        statLabel="tasks solved, even once, by every configuration."
        intro={
          <>
            <p>
              Most results between 69% and 75% sit inside each other&apos;s 95% ranges, and two runs of the
              same HydraFusion release scored {pct(passRate(hydraRun1))} and {pct(passRate(hydraRun2))}. Read the
              top of the table as a group, not a ranking.
            </p>
            <p>
              Underneath, the configurations differ task by task. {fullBySome} of {taskCount} tasks were solved
              on every attempt by at least one configuration, but none by all of them. The hardest,{" "}
              <code className="font-mono text-[0.9em]">{hardest.id}</code>, was solved by {hardestReach} of{" "}
              {heatRuns.length}. Which configuration is best depends on which tasks you have — which is why we
              test on yours.
            </p>
          </>
        }
      >
        <figure className="m-0 flex flex-col gap-3">
          <figcaption className="font-mono text-xs text-muted">
            Each column is one task, each row one configuration. Darker means more of that run&apos;s attempts
            passed.
          </figcaption>
          <DeepSweTaskHeatmap rows={heatRows} tasks={heatTasks} />
        </figure>
        <div>
          <ArrowLink href={contactHref}>Find out how these configurations do on your tasks</ArrowLink>
        </div>
      </Finding>

      {/* ---------- why trust this ---------- */}
      <DarkBand>
        <Container className="scroll-mt-12 py-26" id="method">
          <AutoGrid min={320} className="items-start gap-14">
            <div className="flex flex-col gap-4">
              <Eyebrow dark>Why trust these numbers</Eyebrow>
              <H2 dark>The agent doesn&apos;t grade its own homework.</H2>
              <p className="m-0 text-night-muted">
                Implementation and verification are separate, so a claimed fix and a verified fix can never be
                confused.
              </p>
              <p className="m-0 text-night-muted">
                And our results match independently published ones. Meta released DeepSWE 1.1 results with its
                Muse Spark 1.2 launch, running each model in its own agent product, five attempts per task, on
                its own infrastructure. On both configurations we share, our pass rate is within{" "}
                {maxSameGap.toFixed(1)} points of Meta&apos;s — three to four passes in 565 attempts.
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

      <section className="border-t border-line bg-surface">
        <Container className="flex flex-col gap-6 py-16">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h3 className="m-0 text-[21px] font-semibold">Checked against Meta&apos;s published results</h3>
            <ArrowLink href={metaSource}>Meta&apos;s results</ArrowLink>
          </div>
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
          <p className="m-0 max-w-[90ch] font-mono text-xs text-muted">
            Meta publishes overall rates only, with no per-task results, so this is an unpaired check rather than
            a replication. GPT-5.6 Terra ran in Copilot for us and in Codex for Meta, so that row also compares two
            harnesses. Meta&apos;s figure falls inside our 95% range on all three.
          </p>
        </Container>
      </section>

      {/* ---------- reference ---------- */}
      <section id="results" className="scroll-mt-12 border-t border-line">
        <Container className="flex flex-col gap-10 py-26">
          <div className="flex max-w-[64ch] flex-col gap-4">
            <Eyebrow>All results</Eyebrow>
            <H2>Every configuration, every number.</H2>
            <p className="m-0 text-ink-2">
              The data behind the findings above, for readers who want to check a figure or look up a
              configuration. Sorted by pass rate; select a column header to re-sort.
            </p>
          </div>
          <DeepSweTable
            definitions={
              <>
                pass@1 = passing attempts ÷ planned attempts. 95% range = ±1.96 task-clustered standard errors,
                in points. Broke tests = attempts where at least one pre-existing test failed. $/attempt = mean
                over attempts with cost data. Runs with an added guidance pack are reported under Finding 1.
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

      <section id="limitations" className="scroll-mt-12 border-t border-line bg-surface">
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
      </section>

      <section className="border-t border-line bg-ink text-night-text">
        <Container className="flex flex-wrap items-end justify-between gap-8 py-16">
          <div className="flex max-w-[60ch] flex-col gap-3">
            <Eyebrow dark>Same method, our own code — WharfSWE</Eyebrow>
            <p className="m-0 font-display text-[clamp(26px,3vw,36px)] leading-[1.1] text-paper">
              {sweRuns.length} more runs on .NET code, cheap enough to repeat on every Copilot release.
            </p>
            <p className="m-0 text-night-muted">
              The same task format, runner and verifier, on {wharfSweTaskCount} C# tasks rebuilt from Wharf&apos;s
              own release history — enterprise-style .NET code that DeepSWE doesn&apos;t cover.
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
