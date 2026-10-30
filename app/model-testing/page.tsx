import type { Metadata } from "next";
import Link from "next/link";
import { researchHref } from "@/lib/site";
import { passRate, pct, run, runs, taskCount, totalPlanned, usd, wharfDate } from "@/content/wharf";
import {
  ArrowLink,
  AutoGrid,
  Container,
  CtaStrip,
  DarkBand,
  EngagementSection,
  Eyebrow,
  FeatureCard,
  H2,
  HairlineGrid,
  PageHero,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Model Testing & Evals",
  description:
    "How Frontier Engineering tests models and agent harnesses, and the evals that ship with every system we build.",
};

const report = [
  { id: "copilot-gpt-5.6-luna-max-1.0.77", tone: "best" },
  { id: "copilot-gemini-3.8-flash-high-1.0.91" },
  { id: "copilot-claude-opus-5-max-1.0.77" },
  { id: "copilot-gpt-6-astra-max-1.0.91" },
  { id: "copilot-claude-opus-5.5-max-1.0.95" },
  { id: "cc-claude-opus-5-max-2.1.220" },
  { id: "copilot-auto-max-1.0.77", tone: "worst" },
].map(({ id, tone }) => ({ ...run(id), tone }));

const findings = [
  { tag: "harness", title: "Same model, different harness, different result.", body: "Claude Opus 5 passed 71.2% of attempts inside GitHub Copilot and 64.4% inside Claude Code — and cost 58% less per attempt ($5.66 vs $13.49)." },
  { tag: "cost", title: "A low-cost configuration tied for the highest pass rate.", body: "GPT-5.6 Luna passed 74.1% at $0.37 per attempt — about 1/32 the cost of Claude Opus 5.5, which scored 70.8%." },
  { tag: "upgrade", title: "One run isn't a verdict.", body: "Luna scored 74.1% on one Copilot CLI release and 69.9% on the next, same model. These runs do not isolate the effect of the harness upgrade from run-to-run variation. Upgrade decisions need repeated trials, not a single score." },
];

const systemParts = ["model", "prompts", "reasoning effort", "tools", "agent harness", "environment", "verification"];

const tests = [
  { tag: "select", title: "Model selection", body: "Head-to-head comparisons across providers and sizes on your workload, weighing quality, latency and cost together." },
  { tag: "golden", title: "Golden datasets", body: "Curated, versioned test sets labelled with your domain experts — the ground truth every change is measured against." },
  { tag: "grade", title: "Graders you can trust", body: "Code checks where possible, model-graded rubrics where needed — each calibrated against human judgment." },
  { tag: "agents", title: "Agent & tool-use evals", body: "Multi-step trajectory testing: did the agent call the right tools, recover from errors and stop when it should?" },
  { tag: "redteam", title: "Safety & red-teaming", body: "Adversarial suites for prompt injection, data leakage and policy violations before your users find them." },
  { tag: "drift", title: "Production monitoring", body: "Online evals and sampling that catch drift when inputs, models or upstream data change underneath you." },
];

const gateSteps = [
  ["01", "A change is proposed", "model, prompt, tool, harness, routing", "trigger"],
  ["02", "Run the eval suite", "your golden set, repeated trials", "CI"],
  ["03", "Compare to baseline", "quality, reliability, cost, latency", "report"],
  ["04", "Check for regressions", "does anything that passed now fail?", "CI"],
  ["05", "Approve or hold", "against thresholds agreed up front", "human"],
];

const triggers = [
  "A new model launched and you don't know if switching is safe.",
  "Prompt tweaks fix one case and quietly break three others.",
  "Leadership wants proof before a wider rollout.",
  "Your AI spend is climbing and nobody knows what a cheaper model would cost you in quality.",
  "A regulator, auditor or customer is asking how you test.",
];

function EvalReport() {
  const cell = "border-b border-night-line px-2 py-2.5";
  return (
    <figure className="m-0 flex flex-col gap-4 bg-ink p-6 font-mono text-[13px] text-night-text">
      <div className="flex justify-between gap-4 text-night-dim">
        <span>deepswe · {taskCount} tasks</span>
        <span>{wharfDate.toLowerCase()}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] border-collapse">
          <thead>
            <tr className="text-left text-night-dim">
              {["model", "harness", "pass@1", "$/attempt"].map((h) => (
                <th key={h} className="border-b border-night-line px-2 py-2.5 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.map((r) => (
              <tr
                key={r.id}
                className={r.tone === "best" ? "text-accent-soft" : r.tone === "worst" ? "text-warn-soft" : undefined}
              >
                <td className={cell}>{r.model}</td>
                <td className={cell}>{r.harness}</td>
                <td className={cell}>{pct(passRate(r))}</td>
                <td className={cell}>{usd(r.costPerAttempt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="text-night-dim">
        Max reasoning effort (Gemini: high), 4–5 planned attempts per task. Cost is the mean per attempt
        with cost data; missing costs are excluded, not zeroed.{" "}
        <Link href={researchHref} className="underline hover:text-paper">
          Methodology &amp; full results
        </Link>
      </figcaption>
    </figure>
  );
}

export default function ModelTestingPage() {
  return (
    <>
      <PageHero
        eyebrow="Research — Model testing & evals"
        title="Benchmarks don't run your business. Your tasks do."
        lede="We test models and agent harnesses on real tasks before we trust them. The same discipline goes into every system we build, so choosing a model, changing a prompt or upgrading a version is a decision backed by repeatable tests."
        aside={<EvalReport />}
      />

      <section className="border-t border-line">
        <Container className="py-18">
          <AutoGrid min={320} className="gap-12">
            <div className="flex flex-col gap-4">
              <Eyebrow>System, not model</Eyebrow>
              <H2>Evaluate the system, not just the model.</H2>
            </div>
            <div className="flex flex-col gap-5">
              <p className="m-0 text-ink-2">
                A model&apos;s results depend on everything around it. Claude Opus 5 passed 71.2% of
                attempts in GitHub Copilot at $5.66 per attempt, compared with 64.4% in Claude
                Code at $13.49 per attempt. We test the pieces together and find the configuration that meets your quality, reliability,
                latency and cost targets on your own workload.
              </p>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0 font-mono text-[13px] text-ink-2">
                {systemParts.map((p) => (
                  <li key={p} className="border border-line bg-surface px-2.5 py-1">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </AutoGrid>
        </Container>
      </section>

      <section className="border-t border-line bg-surface">
        <Container className="flex flex-col gap-12 py-26">
          <H2>What we test</H2>
          <HairlineGrid>
            {tests.map((t) => (
              <FeatureCard key={t.tag} tag={t.tag} title={t.title} tone="surface">
                {t.body}
              </FeatureCard>
            ))}
          </HairlineGrid>
        </Container>
      </section>

      <section className="border-t border-line">
        <Container className="flex flex-col gap-12 py-26">
          <div className="flex flex-col gap-4">
            <Eyebrow>From our own bench</Eyebrow>
            <H2>
              {runs.length} agent configurations. {totalPlanned.toLocaleString("en-US")} planned attempts at
              real engineering tasks.
            </H2>
            <p className="m-0 max-w-[60ch] text-ink-2">
              In {wharfDate}, we tested models and harnesses on {taskCount} DeepSWE software
              tasks, with four or five planned attempts per task for each configuration. Missing
              attempts count as failures. The leaderboard wasn&apos;t the interesting part.
            </p>
          </div>
          <HairlineGrid min={260}>
            {findings.map((f) => (
              <FeatureCard key={f.tag} tag={f.tag} title={f.title}>
                {f.body}
              </FeatureCard>
            ))}
          </HairlineGrid>
          <div>
            <ArrowLink href={researchHref}>Read the full Wharf research</ArrowLink>
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-surface">
        <Container className="py-26">
          <AutoGrid min={320} className="items-start gap-14">
            <div className="flex flex-col gap-4">
              <Eyebrow>Release gates</Eyebrow>
              <H2>Every AI update is a potential regression.</H2>
              <p className="m-0 text-ink-2">
                Models, prompts, tools and agent frameworks change constantly — often underneath
                you, when a provider ships a new version. We wire your eval suite into the release
                process, so every change is measured against a baseline from your own workload
                before it reaches users.
              </p>
              <p className="m-0 text-ink-2">
                Repeated trials tell a real regression from run-to-run noise, so a hold means
                something and so does an approval.
              </p>
            </div>
            <ol className="m-0 flex list-none flex-col border-b border-line p-0">
              {gateSteps.map(([n, step, detail, who]) => (
                <li key={n} className="grid grid-cols-[48px_1fr_auto] gap-3 border-t border-line py-[18px]">
                  <span className="font-mono text-[15px] text-accent-ink">{n}</span>
                  <div>
                    <p className="m-0 font-medium">{step}</p>
                    <p className="m-0 text-ink-2">{detail}</p>
                  </div>
                  <span className="font-mono text-[13px] text-muted">{who}</span>
                </li>
              ))}
            </ol>
          </AutoGrid>
        </Container>
      </section>

      <DarkBand>
        <Container className="py-26">
          <AutoGrid min={320} className="gap-14">
            <div className="flex flex-col gap-4">
              <Eyebrow dark>Why we test</Eyebrow>
              <H2 dark>You can&apos;t answer &ldquo;is it better?&rdquo; with confidence.</H2>
            </div>
            <ul className="m-0 flex list-none flex-col border-b border-night-line p-0">
              {triggers.map((t) => (
                <li key={t} className="border-t border-night-line py-[18px] text-paper">
                  {t}
                </li>
              ))}
            </ul>
          </AutoGrid>
        </Container>
      </DarkBand>

      <EngagementSection
        intro={
          <>
            <H2>Built into every engagement</H2>
            <p className="m-0 max-w-[44ch] text-ink-2">
              We don&apos;t sell evals on their own. Every system we build, Done for You or with
              your team, ships with its eval suite wired into CI.
            </p>
          </>
        }
        deliverables={[
          { title: "An eval harness", body: "Runs your tasks against any model, prompt or agent configuration, with repeated trials." },
          { title: "Golden sets", body: "Versioned test cases labelled with your domain experts." },
          { title: "Release gates in CI", body: "Every AI change measured against your baseline before it reaches users." },
          { title: "A model recommendation", body: "The configuration that meets your quality, cost and latency targets — with the evidence." },
        ]}
        doneWhen="A model or prompt change gets an approve-or-hold from your own pipeline, without us in the loop."
      />

      <CtaStrip
        title="Know what your model can do before your users do."
        href={researchHref}
        label="Read the Wharf research"
      />
    </>
  );
}
