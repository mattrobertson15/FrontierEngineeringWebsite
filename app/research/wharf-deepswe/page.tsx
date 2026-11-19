import type { Metadata } from "next";
import Link from "next/link";
import { benchmarksHref, contactHref, researchHref, wharfSweHref } from "@/lib/site";
import { CostQualityChart } from "@/components/CostQualityChart";
import { DeepSweTable } from "@/components/wharf/ResultTables";
import { WharfSwitcher } from "@/components/wharf/WharfSwitcher";
import { sweRuns, wharfSweTaskCount } from "@/content/wharf-swe";
import {
  passRate,
  pct,
  run,
  runs,
  taskCount,
  totalPlanned,
  usd,
  wharfCommit,
  wharfDate,
  wharfSource,
} from "@/content/wharf";
import {
  ArrowLink,
  AutoGrid,
  Container,
  CtaStrip,
  DarkBand,
  Eyebrow,
  FeatureCard,
  H2,
  HairlineGrid,
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
const opus55 = run("copilot-claude-opus-5.5-max-1.0.95");
const astra = run("copilot-gpt-6-astra-max-1.0.91");
const auto = run("copilot-auto-max-1.0.77");
const hydra = run("copilot-hydrafusion-default-1.0.98");

const findings = [
  {
    tag: "01 · harness",
    title: "The harness is part of the product.",
    body: `Claude Opus 5 passed ${pct(passRate(opusCopilot))} of attempts inside GitHub Copilot and ${pct(passRate(opusClaudeCode))} inside Claude Code, at ${usd(opusCopilot.costPerAttempt)} versus ${usd(opusClaudeCode.costPerAttempt)} per attempt. Same model; different tools, context handling and prompts around it.`,
  },
  {
    tag: "02 · cost",
    title: "More expensive isn't more effective.",
    body: `GPT-5.6 Luna passed ${pct(passRate(luna))} at ${usd(luna.costPerAttempt)} per attempt. Claude Opus 5.5 passed ${pct(passRate(opus55))} at ${usd(opus55.costPerAttempt)}. Routing is no shortcut either: Copilot's Auto router passed ${pct(passRate(auto))}, its HydraFusion router ${pct(passRate(hydra))}.`,
  },
  {
    tag: "03 · regressions",
    title: "Passing the task isn't enough.",
    body: `GPT-6 Astra and Claude Opus 5 (Copilot) passed almost the same number of attempts — ${astra.passing} and ${opusCopilot.passing}. But ${astra.regressions} of Astra's attempts broke existing tests, against ${opusCopilot.regressions} for Opus 5.`,
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
  ["01", "Fixed task set", `${taskCount} DeepSWE tasks, 4–5 planned attempts each. Every planned attempt stays in the denominator — a crash or a missing attempt counts as a failure.`],
  ["02", "Isolated agent run", "Each attempt runs in its own clean environment. The agent's only output is a patch."],
  ["03", "Independent verifier", "A separate environment applies the patch and runs the task's tests. An attempt passes only on a positive verifier result; a timeout scores zero."],
  ["04", "Regression check", "Pre-existing tests run too. Breaking them is recorded separately, not hidden inside the pass rate."],
  ["05", "Evidence retained", "Patches, logs, agent trajectories, verifier output, timing, token usage and cost — for every attempt."],
];

const limitations = [
  `These results describe ${taskCount} open-source coding tasks. Your workload may rank the same configurations differently — that's the point of testing on it.`,
  "Harness comparisons change more than one thing at once: the harness release, its prompts and its tools all differ.",
  `Attempts on the same task are correlated. These runs do not isolate harness changes from run-to-run variation: Luna scored ${pct(passRate(luna))} and ${pct(passRate(run("copilot-gpt-5.6-luna-max-1.0.91")))} on Copilot releases 1.0.77 and 1.0.91.`,
  `Cost is missing for some attempts — ${Math.round((1 - opus55.costCoverage) * 100)}% of the Opus 5.5 run and all of the Muse Spark run. Missing costs are excluded from averages, never counted as zero.`,
  "Regression counts cover attempts where existing tests could be measured. Unmeasured is unknown, not clean.",
  `Models and harnesses ship monthly. This is a ${wharfDate} snapshot.`,
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
            <Eyebrow>Key findings</Eyebrow>
            <H2>Three things a leaderboard doesn&apos;t show.</H2>
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
                  { id: luna.id, text: "GPT-5.6 Luna · 1.0.77" },
                  { id: "copilot-gpt-5.6-luna-max-1.0.91", text: "GPT-5.6 Luna · 1.0.91", dy: 12 },
                  { id: opusCopilot.id, text: "Opus 5 · Copilot", anchor: "end" },
                  { id: opusClaudeCode.id, text: "Opus 5 · Claude Code", anchor: "end" },
                ]}
              />
            </div>
            <figcaption className="font-mono text-xs text-muted">
              Muse Spark appears in the Duration view because no cost was recorded. Hover or tab
              through the dots for details.
            </figcaption>
          </figure>
          <DeepSweTable />
          <p className="m-0 font-mono text-xs text-muted">
            pass@1 = passing attempts ÷ planned attempts. Broke tests = attempts where at least one
            pre-existing test failed. $/attempt = mean over attempts with cost data. Select a column
            header to sort. Source:{" "}
            <a href={wharfSource} className="underline hover:text-ink">
              Wharf @ {wharfCommit}
            </a>
            .
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
