import type { Metadata } from "next";
import { contactHref } from "@/lib/site";
import { CostQualityChart } from "@/components/CostQualityChart";
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
    "What thousands of verified coding-agent attempts show about harnesses, cost, regressions and reliability.",
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
  `Attempts on the same task are correlated. Gaps of a few points are within run-to-run noise: the same Luna configuration scored ${pct(passRate(luna))} and ${pct(passRate(run("copilot-gpt-5.6-luna-max-1.0.91")))} on consecutive Copilot releases.`,
  `Cost is missing for some attempts — ${Math.round((1 - opus55.costCoverage) * 100)}% of the Opus 5.5 run and all of the Muse Spark run. Missing costs are excluded from averages, never counted as zero.`,
  "Regression counts cover attempts where existing tests could be measured. Unmeasured is unknown, not clean.",
  `Models and harnesses ship monthly. This is a ${wharfDate} snapshot.`,
];

function ResultsTable() {
  const cell = "border-b border-line px-3 py-2.5 whitespace-nowrap";
  const head = ["model", "harness", "effort", "passed", "pass@1", "broke tests", "$/attempt", "costed"];
  return (
    <div className="overflow-x-auto border border-line bg-surface">
      <table className="w-full border-collapse font-mono text-[13px]">
        <thead>
          <tr className="text-left text-muted">
            {head.map((h, i) => (
              <th key={h} className={`${cell} font-normal ${i > 2 ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-ink-2">
          {runs.map((r) => (
            <tr key={r.id}>
              <td className={`${cell} text-ink`}>{r.model}</td>
              <td className={cell}>
                {r.harness} {r.version}
              </td>
              <td className={cell}>{r.effort}</td>
              <td className={`${cell} text-right`}>
                {r.passing}/{r.planned}
              </td>
              <td className={`${cell} text-right text-ink`}>{pct(passRate(r))}</td>
              <td className={`${cell} text-right`}>{r.regressions}</td>
              <td className={`${cell} text-right`}>{usd(r.costPerAttempt)}</td>
              <td className={`${cell} text-right`}>{Math.round(r.costCoverage * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WharfResearchPage() {
  return (
    <>
      <PageHero
        eyebrow="Research — Wharf / DeepSWE"
        title={`What ${totalPlanned.toLocaleString("en-US")} coding-agent attempts reveal.`}
        lede="Wharf is our benchmark platform for AI coding agents: real software tasks, repeated attempts, an independent verifier, and every result retained. We pointed it at today's frontier models and harnesses."
        aside={
          <StatGrid
            items={[
              { label: "TASKS", value: String(taskCount) },
              { label: "CONFIGURATIONS", value: String(runs.length) },
              { label: "ATTEMPTS", value: totalPlanned.toLocaleString("en-US") },
              { label: "ATTEMPTS PER TASK", value: "4–5" },
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
            <H2>Quality against cost, every configuration.</H2>
            <p className="m-0 max-w-[60ch] text-ink-2">
              Each dot is a complete configuration — model, harness release and reasoning effort.
              Up and to the left is better. The copper line joins Claude Opus 5 under two
              harnesses.
            </p>
          </div>
          <figure className="m-0 flex flex-col gap-3">
            <div className="overflow-x-auto border border-line bg-surface p-4">
              <CostQualityChart
                runs={runs}
                pair={[opusCopilot.id, opusClaudeCode.id]}
                labels={[
                  { id: luna.id, text: "GPT-5.6 Luna" },
                  { id: opusCopilot.id, text: "Opus 5 · Copilot", anchor: "end" },
                  { id: opusClaudeCode.id, text: "Opus 5 · Claude Code", anchor: "end" },
                  { id: auto.id, text: "Copilot Auto" },
                ]}
              />
            </div>
            <figcaption className="font-mono text-xs text-muted">
              Muse Spark is omitted from the chart: no cost was recorded for it. Hover or tab
              through the dots for details.
            </figcaption>
          </figure>
          <ResultsTable />
          <p className="m-0 font-mono text-xs text-muted">
            pass@1 = passing attempts ÷ planned attempts. Broke tests = attempts where at least one
            pre-existing test failed. $/attempt = mean over attempts with cost data. Source:{" "}
            <a href={wharfSource} className="underline hover:text-ink">
              Wharf @ {wharfCommit}
            </a>
            .
          </p>
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
            <div>
              <ArrowLink href={wharfSource}>Code, raw data &amp; methodology on GitHub</ArrowLink>
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
        label="Scope an eval program"
      />
    </>
  );
}
