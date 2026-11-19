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
import { HarnessDumbbell } from "@/components/wharf/HarnessDumbbell";
import { RevisionChart, type Series } from "@/components/wharf/RevisionChart";
import taskResults from "@/content/wharf-swe-task-results.json";
import { TaskHeatmap, type TaskComparison } from "@/components/wharf/TaskHeatmap";
import { SweTable } from "@/components/wharf/ResultTables";
import { WharfSwitcher } from "@/components/wharf/WharfSwitcher";
import {
  ArrowLink,
  AutoGrid,
  Container,
  CtaStrip,
  Eyebrow,
  FeatureCard,
  H2,
  HairlineGrid,
  PageHero,
  StatGrid,
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

const outcomes: Record<string, { id: string; checksum: string | null; attempts: number; passes: number }[]> = taskResults;
const taskComparisons = crossHarness.flatMap(({ model, runs }): TaskComparison[] => {
  const copilot = runs.find((run) => run.harness === "copilot-cli");
  const codex = runs.find((run) => run.harness === "codex");
  if (!copilot || !codex) return [];

  const tasks = sweTasks.flatMap((task) => {
    const a = outcomes[copilot.id]?.find((result) => result.id === task.id);
    const b = outcomes[codex.id]?.find((result) => result.id === task.id);
    if (!a?.checksum || a.checksum !== b?.checksum || a.attempts !== 4 || b.attempts !== 4) return [];
    return [{ id: task.id, title: task.title, attempts: a.attempts, copilot: a.passes, codex: b.passes }];
  });
  if (tasks.length !== sweTasks.length) return [];
  return [{ model, copilotVersion: copilot.version, codexVersion: codex.version, tasks }];
});

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

const findings = [
  {
    tag: "01 · harness",
    title: "The best harness depends on the model.",
    body: `${widest.model} passed ${widestHigh.passes} of ${widestHigh.trials} trials on ${harnessLabel[widestHigh.harness]} and ${widestLow.passes} on ${harnessLabel[widestLow.harness]}, with ${widestHigh.p2pErrors} and ${widestLow.p2pErrors} broken-test trials.${
      opusRow && opusOn("claude") && opusOn("copilot-cli")
        ? ` Claude Opus 5.5 went the other way: ${opusOn("claude")!.passes}/56 on Claude Code against ${opusOn("copilot-cli")!.passes}/56 on Copilot.`
        : ""
    }`,
  },
  {
    tag: "02 · variance",
    title: "One run is not a ranking.",
    body: `HydraFusion ran on ${hydra.runs} Copilot releases against the same ${wharfSweTaskCount} task IDs and scored anywhere from ${hydra.lo} to ${hydra.hi} of 56. A comparison that rests on a single run can be read off the noise.`,
  },
  {
    tag: "03 · cost",
    title: "The last few points are expensive.",
    body: `On Copilot, GPT-6 Astra averaged ${pct(meanRate("GPT-6 Astra"))} at about $${meanCost("GPT-6 Astra").toFixed(2)} a trial. GPT-6 Luna averaged ${pct(meanRate("GPT-6 Luna"))} at about $${meanCost("GPT-6 Luna").toFixed(3)}: roughly ${costRatio}× cheaper. Whether that gap is worth paying for depends on the work.`,
  },
];

const limitations = [
  `${wharfSweTaskCount} tasks from one C# codebase — Wharf's own. Small and specific by design; treat it as a regression suite, not a general ranking.`,
  "Each task checks for regressions with a single pre-existing test, so \"broke tests\" here is a far narrower check than on DeepSWE. Zero is good, not proof of a clean patch.",
  "The tasks have been revised over time: several early 1.0.95 runs used an earlier version of them, so the oldest points are not a strictly like-for-like comparison.",
  `Same method as DeepSWE, different tasks: don't compare pass rates across the two. A 98% here and a 74% on DeepSWE measure different work.`,
  "The harness comparisons change more than the harness: the latest Copilot runs used 16 parallel trials where Codex and Claude Code used 12, and each harness is at its own release.",
  "Codex retains no billed cost. Its figures are API-list-price estimates from token counts, not what a subscription would charge, and they are marked ~ wherever they appear.",
  "Lines across Copilot releases join observed runs only. Host and preparation settings changed over time, so these describe what happened rather than isolate a release's effect.",
];

export default function WharfSwePage() {
  return (
    <>
      <WharfSwitcher active={wharfSweHref} />
      <PageHero
        eyebrow="Research — Wharf / WharfSWE"
        title="The same model, run after run, harness by harness."
        lede={`WharfSWE is built the same way as DeepSWE — same task format, runner and independent verifier — but its ${wharfSweTaskCount} tasks are C# features rebuilt from Wharf's own release history. Every task is attempted four times per run.`}
        aside={
          <StatGrid
            items={[
              { label: "TASKS", value: String(wharfSweTaskCount) },
              { label: "COMPLETED RUNS", value: String(sweRuns.length) },
              { label: "TRIALS", value: sweTotalTrials.toLocaleString("en-US") },
              { label: "HARNESSES", value: String(harnesses.length) },
            ]}
          />
        }
      />

      <section className="border-t border-line bg-surface">
        <Container className="flex flex-col gap-12 py-26">
          <AutoGrid min={340} className="items-start gap-14">
            <div className="flex flex-col gap-4">
              <Eyebrow>The task set</Eyebrow>
              <H2>{wharfSweTaskCount} releases of Wharf, one task each.</H2>
              <p className="m-0 text-ink-2">
                Each task hands the agent Wharf&apos;s source as it stood at one release and asks for
                the next release&apos;s feature, matching its exact public API. The agent works with
                no network access and a 60-minute limit. A separate verifier then applies the patch
                in a fresh environment: three or four new contract tests must pass, and an existing
                test must keep passing.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <p className="m-0 font-mono text-xs tracking-[0.08em] text-muted uppercase">Why a second task set</p>
              <dl className="m-0 flex flex-col border-b border-line">
                <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-4 border-t border-line py-4">
                  <dt className="font-medium">Coverage</dt>
                  <dd className="m-0 text-ink-2">
                    Enterprise-style .NET service code — schedulers, recovery, packaging — which
                    DeepSWE&apos;s {deepSweTaskCount} open-source tasks don&apos;t include.
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-4 border-t border-line py-4">
                  <dt className="font-medium">Cost</dt>
                  <dd className="m-0 text-ink-2">
                    In Wharf&apos;s published HydraFusion comparison, four attempts per task cost
                    $15.01 and took about 9.5 minutes on WharfSWE. The DeepSWE run on Copilot 1.0.98
                    recorded $546.71 in known cost and took about six hours.{" "}
                    <a className="underline" href={`https://github.com/bartr/wharf/blob/${wharfSweCommit}/docs/RETRO.md#wharfswe-benchmark-net-coverage-at-a-fraction-of-the-cost`}>
                      See the run comparison
                    </a>.
                  </dd>
                </div>
              </dl>
            </div>
          </AutoGrid>
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
        </Container>
      </section>

      <section className="border-t border-line">
        <Container className="flex flex-col gap-12 py-26">
          <div className="flex flex-col gap-4">
            <Eyebrow>Key findings</Eyebrow>
            <H2>What {sweRuns.length} runs on one codebase show.</H2>
          </div>
          <HairlineGrid min={300}>
            {findings.map((f) => (
              <FeatureCard key={f.tag} tag={f.tag} title={f.title} tone="surface">
                {f.body}
              </FeatureCard>
            ))}
          </HairlineGrid>
        </Container>
      </section>

      <section className="border-t border-line bg-surface">
        <Container className="flex flex-col gap-10 py-26">
          <div className="flex flex-col gap-4">
            <Eyebrow>Across harnesses</Eyebrow>
            <H2>Same model, different harness.</H2>
            <p className="m-0 max-w-[60ch] text-ink-2">
              Each row is one model at its newest run on every harness we tested it on. The line
              between the dots shows the observed gap between configurations.
            </p>
          </div>
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
        </Container>
      </section>

      {taskComparisons.length > 0 && (
        <section className="border-t border-line">
          <Container className="flex flex-col gap-8 py-26">
            <div className="flex flex-col gap-4">
              <Eyebrow>By task</Eyebrow>
              <H2>Which tasks did each configuration solve?</H2>
              <p className="m-0 max-w-[60ch] text-ink-2">
                Compare Copilot and Codex runs of the same model on identical task versions.
              </p>
            </div>
            <TaskHeatmap comparisons={taskComparisons} />
          </Container>
        </section>
      )}

      <section className="border-t border-line">
        <Container className="flex flex-col gap-10 py-26">
          <div className="flex flex-col gap-4">
            <Eyebrow>Across releases</Eyebrow>
            <H2>Release by release on Copilot.</H2>
            <p className="m-0 max-w-[60ch] text-ink-2">
              Every Copilot CLI release from 1.0.{firstChartedRevision} to 1.0.{latestCopilotRevision} we ran, for the
              models we track. Switch the metric, select a model to isolate it, and hover — or
              focus the chart and use the arrow keys — to read every model at one release.
            </p>
          </div>
          <div className="border border-line bg-surface p-5">
            <RevisionChart series={series} />
          </div>
        </Container>
      </section>

      <section id="results" className="border-t border-line bg-surface">
        <Container className="flex flex-col gap-8 py-26">
          <div className="flex flex-col gap-4">
            <Eyebrow>All results</Eyebrow>
            <H2>Every completed run.</H2>
          </div>
          <SweTable runs={sweRuns} />
          <p className="m-0 font-mono text-xs text-muted">
            pass@1 = passing trials ÷ 56. Broke tests = trials whose patch failed at least one
            pre-existing test. $/trial = billed cost per trial; ~* marks a Codex API-price estimate.
            Agent time excludes setup and verification. Source:{" "}
            <a href={wharfSweSource} className="underline hover:text-ink">
              Wharf @ {wharfSweCommit}
            </a>
            , verified {wharfSweVerified}.
          </p>
        </Container>
      </section>

      <section className="border-t border-line">
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

      <CtaStrip
        title="Run this on your own codebase."
        href={contactHref}
        label="Request a discovery call"
      />
    </>
  );
}
