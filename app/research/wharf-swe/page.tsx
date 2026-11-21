import type { Metadata } from "next";
import { contactHref, researchHref, wharfSweHref } from "@/lib/site";
import { pct, taskCount as deepSweTaskCount } from "@/content/wharf";
import {
  copilotRuns,
  firstChartedRevision,
  harnessLabel,
  latestCopilotRevision,
  revision,
  sweRate,
  sweRuns,
  sweTasks,
  sweTotalTrials,
  trackedModels,
  wharfSweCommit,
  wharfSweSource,
  wharfSweTaskCount,
  wharfSweVerified,
  type HarnessKey,
  type SweRun,
} from "@/content/wharf-swe";
import { SectionNav } from "@/components/SectionNav";
import { HarnessDumbbell } from "@/components/wharf/HarnessDumbbell";
import { Strip } from "@/components/wharf/MiniCharts";
import { Finding, FindingsIndex, More, Aside } from "@/components/wharf/Story";
import { RevisionChart, type Series } from "@/components/wharf/RevisionChart";
import taskResults from "@/content/wharf-swe-task-results.json";
import { TaskHeatmap } from "@/components/wharf/TaskHeatmap";
import { taskComparisons, type TaskOutcome } from "@/content/wharf-swe-tasks";
import { SweTable } from "@/components/wharf/ResultTables";
import { WharfSwitcher } from "@/components/wharf/WharfSwitcher";
import {
  ArrowLink,
  AutoGrid,
  Container,
  CtaStrip,
  Eyebrow,
  H2,
  HairlineGrid,
  PageHero,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "WharfSWE: Coding Agents Across Harness Releases",
  description:
    "Repeated coding-agent runs on Wharf's own C# codebase: how the same model moves between harnesses and from one release to the next.",
};

const harnesses = [...new Set(sweRuns.map((r) => r.harness))];

/* ---------- same model, different harness ---------- */

/** Newest run of a model on each harness it was tested on. */
function newestByHarness(model: string) {
  const out: SweRun[] = [];
  for (const h of harnesses) {
    const candidates = sweRuns.filter((r) => r.model === model && r.harness === h);
    if (candidates.length) out.push(candidates.reduce((a, b) => (revision(b) > revision(a) ? b : a)));
  }
  return out;
}

const crossHarness = [...new Set(sweRuns.map((r) => r.model))]
  .map((model) => ({ model, runs: newestByHarness(model) }))
  .filter((row) => row.runs.length > 1)
  .sort((a, b) => Math.max(...b.runs.map(sweRate)) - Math.max(...a.runs.map(sweRate)));

const gap = (row: { runs: SweRun[] }) => {
  const rates = row.runs.map(sweRate);
  return Math.max(...rates) - Math.min(...rates);
};
const widest = crossHarness.reduce((a, b) => (gap(b) > gap(a) ? b : a));
const [widestHigh, widestLow] = [...widest.runs].sort((a, b) => sweRate(b) - sweRate(a));
const opusRow = crossHarness.find((r) => r.model === "Claude Opus 5.5");
const opusOn = (h: HarnessKey) => opusRow?.runs.find((r) => r.harness === h);

const outcomes: Record<string, TaskOutcome[]> = taskResults;
/** Every fair Copilot-vs-other-harness pairing; the sync script reports any it has to leave out. */
const taskPairs = taskComparisons(sweRuns, outcomes).comparisons.map((c) => ({
  ...c,
  otherLabel: harnessLabel[c.harness as HarnessKey],
}));

/* ---------- across Copilot releases ---------- */

const seriesColors = ["var(--color-series-1)", "var(--color-series-2)", "var(--color-series-3)", "var(--color-series-4)", "var(--color-series-5)"];
const series: Series[] = trackedModels.map((model, i) => ({
  model,
  color: seriesColors[i],
  points: copilotRuns
    .filter((r) => r.model === model && revision(r) >= firstChartedRevision)
    .map((run) => ({ rev: revision(run), run }))
    .sort((a, b) => a.rev - b.rev),
}));

const spread = (model: string) => {
  const rs = copilotRuns.filter((r) => r.model === model);
  return { runs: rs.length, lo: Math.min(...rs.map((r) => r.passes)), hi: Math.max(...rs.map((r) => r.passes)) };
};
const hydra = spread("HydraFusion");

const meanCost = (model: string) => {
  const rs = copilotRuns.filter((r) => r.model === model && r.costPerTrial !== null);
  return rs.reduce((s, r) => s + r.costPerTrial!, 0) / rs.length;
};
const meanRate = (model: string) => {
  const rs = copilotRuns.filter((r) => r.model === model);
  return rs.reduce((s, r) => s + sweRate(r), 0) / rs.length;
};
const costRatio = Math.round(meanCost("GPT-6 Astra") / meanCost("GPT-6 Luna"));

// Agent time at one Copilot release against each tracked model's previous tested release.
const slowdownRev = 113;
const slowdown = trackedModels.flatMap((model) => {
  const rs = copilotRuns.filter((r) => r.model === model).sort((a, b) => revision(a) - revision(b));
  const i = rs.findIndex((r) => revision(r) === slowdownRev);
  return i > 0 ? [{ model, before: rs[i - 1], after: rs[i] }] : [];
});
const slowed = slowdown.filter((s) => s.after.agentSeconds > s.before.agentSeconds);
const mmss = (s: number) => `${Math.floor(Math.round(s) / 60)}:${String(Math.round(s) % 60).padStart(2, "0")}`;

// Claude Opus 5.5 is the counter-example only while it actually does better off Copilot.
const opusFlips = Boolean(
  opusOn("claude") && opusOn("copilot-cli") && opusOn("claude")!.passes > opusOn("copilot-cli")!.passes,
);
const harnessGapPts = Math.round((sweRate(widestHigh) - sweRate(widestLow)) * 100);
const astraLeadPts = Math.round((meanRate("GPT-6 Astra") - meanRate("GPT-6 Luna")) * 100);

// Each tracked model's mean cost and pass rate across its Copilot runs, for the cost finding.
const copilotByModel = trackedModels
  .filter((model) => copilotRuns.some((r) => r.model === model && r.costPerTrial !== null))
  .map((model) => ({
    model,
    cost: meanCost(model),
    rate: meanRate(model),
    highlight: model === "GPT-6 Astra" || model === "GPT-6 Luna",
  }))
  .sort((a, b) => b.cost - a.cost);

const limitations = [
  `${wharfSweTaskCount} tasks from one C# codebase — Wharf's own. Small and specific by design; treat it as a regression suite, not a general ranking.`,
  "Each task checks for regressions with a single pre-existing test, so \"broke tests\" here is a far narrower check than on DeepSWE. Zero is good, not proof of a clean patch.",
  "The tasks have been revised over time: several early 1.0.95 runs used an earlier version of them, so the oldest points are not a strictly like-for-like comparison.",
  `Same method as DeepSWE, different tasks: don't compare pass rates across the two. A 98% here and a 74% on DeepSWE measure different work.`,
  "The harness comparisons change more than the harness: the latest Copilot runs used 16 parallel trials where Codex and Claude Code used 12, and each harness is at its own release.",
  "Codex retains no billed cost. Its figures are API-list-price estimates from token counts, not what a subscription would charge, and they are marked ~ wherever they appear.",
  "Lines across Copilot releases join observed runs only. Host and preparation settings changed over time, so these describe what happened rather than isolate a release's effect.",
];

const findingList = [
  {
    id: "harness",
    title: "The best harness depends on the model.",
    body: `${widest.model} scored ${harnessGapPts} points higher on ${harnessLabel[widestHigh.harness]} than on ${harnessLabel[widestLow.harness]}.${opusFlips ? " Claude Opus 5.5 did better on Claude Code." : ""}`,
  },
  {
    id: "releases",
    title: "One run is not a ranking.",
    body: `HydraFusion scored ${hydra.lo} to ${hydra.hi} of 56 across ${hydra.runs} Copilot releases. Watch the trend, not a single point.`,
  },
  {
    id: "cost",
    title: "The last few points are expensive.",
    body: `GPT-6 Astra beat GPT-6 Luna on Copilot by about ${astraLeadPts} points, at roughly ${costRatio}× the cost per trial.`,
  },
];

export default function WharfSwePage() {
  return (
    <>
      <WharfSwitcher active={wharfSweHref} />
      <PageHero
        eyebrow="Research — Wharf / WharfSWE"
        title="A coding-agent regression suite, run on every release."
        lede={`WharfSWE uses DeepSWE's method — same task format, runner and independent verifier — on ${wharfSweTaskCount} C# tasks rebuilt from Wharf's own release history. It's small and cheap enough to rerun whenever a model or harness ships: ${sweRuns.length} runs and ${sweTotalTrials.toLocaleString("en-US")} trials so far.`}
        aside={<FindingsIndex findings={findingList} />}
      />

      <SectionNav
        links={[
          { id: "harness", label: "1 · The harness" },
          { id: "releases", label: "2 · Releases" },
          { id: "cost", label: "3 · Cost" },
          { id: "task-set", label: "The task set" },
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
        title={findingList[0].title}
        stat={`${harnessGapPts} pts`}
        statLabel={`${widest.model}: ${harnessLabel[widestHigh.harness]} over ${harnessLabel[widestLow.harness]}.`}
        intro={
          <>
            <p>
              {widest.model} passed {widestHigh.passes} of {widestHigh.trials} trials on{" "}
              {harnessLabel[widestHigh.harness]} and {widestLow.passes} on {harnessLabel[widestLow.harness]}, with{" "}
              {widestHigh.p2pErrors} and {widestLow.p2pErrors} broken-test trials.
              {opusFlips && (
                <>
                  {" "}Claude Opus 5.5 did better away from Copilot: {opusOn("claude")!.passes}/56 on Claude Code against{" "}
                  {opusOn("copilot-cli")!.passes}/56 on Copilot.
                </>
              )}
            </p>
            <p>
              No harness wins for every model, so pick the pair, not the parts. Each row below is one model at
              its newest run on every harness we tested it on.
            </p>
          </>
        }
      >
        <figure className="m-0 flex flex-col gap-3">
          <div className="overflow-x-auto border border-line bg-paper p-5">
            <HarnessDumbbell rows={crossHarness} />
          </div>
          <figcaption className="font-mono text-xs text-muted">
            Releases: {crossHarness
              .flatMap((r) => r.runs)
              .map((r) => `${harnessLabel[r.harness]} ${r.version}`)
              .filter((v, i, all) => all.indexOf(v) === i)
              .join(", ")}
            . Hover or tab through the dots for details.
          </figcaption>
        </figure>
        {taskPairs.length > 0 && (
          <More summary="See which tasks each pairing won and lost">
            <p className="m-0 max-w-[64ch] text-ink-2">
              Each model&apos;s newest Copilot run beside its run on another harness, on identical task
              versions. Pick a pairing to see where the attempts were won and lost.
            </p>
            <TaskHeatmap comparisons={taskPairs} />
          </More>
        )}
      </Finding>

      {/* ---------- 2 ---------- */}
      <Finding
        id="releases"
        n={2}
        of={3}
        title={findingList[1].title}
        stat={`${hydra.lo}–${hydra.hi}`}
        statLabel={`of 56 trials passed: HydraFusion across ${hydra.runs} Copilot releases.`}
        intro={
          <>
            <p>
              The task IDs stayed the same, yet one router&apos;s score moved by {hydra.hi - hydra.lo} trials from
              run to run. A comparison that rests on a single run can be read off the noise, which is why we
              rerun on every Copilot release and read the line, not the dot.
            </p>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="m-0 max-w-[64ch] text-ink-2">
            Every Copilot CLI release from 1.0.{firstChartedRevision} to 1.0.{latestCopilotRevision} we ran, for
            the models we track. Use the change view to compare each run with that model&apos;s prior tested
            release.
          </p>
          <div className="border border-line bg-surface p-5">
            <RevisionChart series={series} />
          </div>
        </div>

        <Aside
          title={`What a release can change: ${slowed.length === slowdown.length ? "every model" : `${slowed.length} of ${slowdown.length} models`} slowed down at 1.0.${slowdownRev}.`}
        >
          <p className="m-0 max-w-[64ch] text-ink-2">
            Mean agent time per trial against each model&apos;s previous tested release:{" "}
            {slowdown.map((s) => `${s.model} ${mmss(s.before.agentSeconds)} → ${mmss(s.after.agentSeconds)}`).join(", ")}.
            Several models moving together points at the harness release more than any one model. Host and
            parallelism settings also changed across these runs, so treat it as an observation to retest, not a
            proven cause.
          </p>
        </Aside>
      </Finding>

      {/* ---------- 3 ---------- */}
      <Finding
        id="cost"
        n={3}
        of={3}
        tone="surface"
        title={findingList[2].title}
        stat={`${costRatio}×`}
        statLabel={`GPT-6 Astra's cost per trial over GPT-6 Luna's, for about ${astraLeadPts} points more.`}
        intro={
          <>
            <p>
              Averaged across their Copilot runs, GPT-6 Astra passed {pct(meanRate("GPT-6 Astra"))} at about $
              {meanCost("GPT-6 Astra").toFixed(2)} a trial and GPT-6 Luna {pct(meanRate("GPT-6 Luna"))} at about $
              {meanCost("GPT-6 Luna").toFixed(3)}. Whether that gap is worth paying for depends on the work: for a
              check that runs on every commit, the cheaper model may be the right one.
            </p>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <Strip
            log
            min={0.005}
            max={2}
            ticks={[0.01, 0.1, 1]}
            format={(t) => `$${t}`}
            labelWidth={72}
            rows={copilotByModel.map((m) => ({
              label: m.model.replace("Claude ", ""),
              points: [{ v: m.cost, kind: m.highlight ? ("accent" as const) : ("ink" as const), label: pct(m.rate), anchor: "start" as const }],
            }))}
            title="Mean cost per trial on Copilot, by model, labelled with mean pass rate"
          />
          <p className="m-0 font-mono text-xs text-muted">
            Mean cost per trial on Copilot (log scale), labelled with mean pass rate. Copper: GPT-6 Astra and
            GPT-6 Luna.
          </p>
        </div>
      </Finding>

      {/* ---------- reference ---------- */}
      <section id="task-set" className="scroll-mt-12 border-t border-line">
        <Container className="flex flex-col gap-10 py-26">
          <AutoGrid min={340} className="items-start gap-14">
            <div className="flex flex-col gap-4">
              <Eyebrow>The task set</Eyebrow>
              <H2>{wharfSweTaskCount} releases of Wharf, one task each.</H2>
              <p className="m-0 text-ink-2">
                Each task hands the agent Wharf&apos;s source as it stood at one release and asks for the next
                release&apos;s feature, matching its exact public API. The agent works with no network access
                and a 60-minute limit. A separate verifier then applies the patch in a fresh environment: three
                or four new contract tests must pass, and an existing test must keep passing.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <p className="m-0 font-mono text-xs tracking-[0.08em] text-muted uppercase">Why a second task set</p>
              <dl className="m-0 flex flex-col border-b border-line">
                <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-4 border-t border-line py-4">
                  <dt className="font-medium">Coverage</dt>
                  <dd className="m-0 text-ink-2">
                    Enterprise-style .NET service code — schedulers, recovery, packaging — which DeepSWE&apos;s{" "}
                    {deepSweTaskCount} open-source tasks don&apos;t include.
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-4 border-t border-line py-4">
                  <dt className="font-medium">Cost</dt>
                  <dd className="m-0 text-ink-2">
                    In Wharf&apos;s published HydraFusion comparison, four attempts per task cost $15.01 and took
                    about 9.5 minutes on WharfSWE. The DeepSWE run on Copilot 1.0.98 recorded $546.71 in known cost
                    and took about six hours.{" "}
                    <a
                      className="underline"
                      href={`https://github.com/bartr/wharf/blob/${wharfSweCommit}/docs/RETRO.md#wharfswe-benchmark-net-coverage-at-a-fraction-of-the-cost`}
                    >
                      See the run comparison
                    </a>
                    .
                  </dd>
                </div>
              </dl>
            </div>
          </AutoGrid>
          <More summary={`All ${wharfSweTaskCount} tasks`}>
            <HairlineGrid min={150} as="ol">
              {sweTasks.map((t) => (
                <li key={t.id} className="flex flex-col gap-1 bg-paper px-5 py-4">
                  <span className="font-mono text-xs text-accent-ink">
                    v{t.from} → v0.{Number(t.from.split(".")[1]) + 1}
                  </span>
                  <span className="font-medium">{t.title}</span>
                </li>
              ))}
            </HairlineGrid>
          </More>
        </Container>
      </section>

      <section id="results" className="scroll-mt-12 border-t border-line bg-surface">
        <Container className="flex flex-col gap-8 py-26">
          <div className="flex max-w-[64ch] flex-col gap-4">
            <Eyebrow>All results</Eyebrow>
            <H2>Every completed run.</H2>
            <p className="m-0 text-ink-2">
              The data behind the findings above. Filter by harness or model, or select a column header to sort.
            </p>
          </div>
          <SweTable runs={sweRuns} />
          <p className="m-0 font-mono text-xs text-muted">
            pass@1 = passing trials ÷ 56. Broke tests = trials whose patch failed at least one pre-existing test.
            $/trial = billed cost per trial; ~* marks a Codex API-price estimate. Agent time excludes setup and
            verification. Source:{" "}
            <a href={wharfSweSource} className="underline hover:text-ink">
              Wharf @ {wharfSweCommit}
            </a>
            , verified {wharfSweVerified}.
          </p>
        </Container>
      </section>

      <section id="limitations" className="scroll-mt-12 border-t border-line">
        <Container className="py-26">
          <AutoGrid min={320} className="items-start gap-14">
            <div className="flex flex-col gap-4">
              <Eyebrow>Limitations</Eyebrow>
              <H2>Read these before quoting a number.</H2>
              <div className="flex flex-col items-start">
                <ArrowLink href={researchHref}>The larger DeepSWE study: {deepSweTaskCount} open-source tasks</ArrowLink>
                <ArrowLink href={wharfSweSource}>Tasks, raw data &amp; methodology on GitHub</ArrowLink>
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

      <CtaStrip title="Run this on your own codebase." href={contactHref} label="Request a discovery call" />
    </>
  );
}
