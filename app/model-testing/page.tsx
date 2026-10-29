import type { Metadata } from "next";
import Link from "next/link";
import { contactHref, researchHref } from "@/lib/site";
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
    "Evaluation harnesses built on your data and success criteria, so model choice, prompt changes and upgrades are measured decisions.",
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
  { tag: "cost", title: "The cheapest model tied for first.", body: "GPT-5.6 Luna passed 74.1% at $0.37 per attempt — about 1/32 the cost of Claude Opus 5.5, which scored 70.8%." },
  { tag: "upgrade", title: "One run isn't a verdict.", body: "Luna scored 74.1% on one Copilot CLI release and 69.9% on the next, same model. A swing that size is within run-to-run noise here — which is why upgrade decisions need repeated trials, not a single score." },
  { tag: "reproduce", title: "Results that hold up.", body: "Where our configurations overlap Meta's published DeepSWE evaluation, our pass rates land within two points of theirs." },
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
        Max reasoning effort (Gemini: high), 4–5 attempts per task. Cost is the mean per attempt
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
        eyebrow="Practice 03 — Model testing & evals"
        title="Benchmarks don't run your business. Your tasks do."
        lede="We build evaluation harnesses on your own data and success criteria, so choosing a model, changing a prompt or upgrading a version is a measured decision — not a vibe check."
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
                A model&apos;s results depend on everything around it. The same model scored 71% in
                one agent harness and 64% in another, at less than half the cost. We test the
                pieces together and find the configuration that meets your quality, reliability,
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
              {runs.length} agent configurations. {totalPlanned.toLocaleString("en-US")} attempts at
              real engineering tasks.
            </H2>
            <p className="m-0 max-w-[60ch] text-ink-2">
              We ran today&apos;s frontier models through DeepSWE — {taskCount} real-world software
              tasks, each attempted four or five times — and scored every attempt against its tests.
              The leaderboard wasn&apos;t the interesting part.
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

      <DarkBand>
        <Container className="py-26">
          <AutoGrid min={320} className="gap-14">
            <div className="flex flex-col gap-4">
              <Eyebrow dark>When teams call us</Eyebrow>
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
            <H2>Typical engagement</H2>
            <p className="m-0 max-w-[44ch] text-ink-2">
              We build the harness alongside your team and wire it into CI, so evals keep running
              long after we&apos;ve left.
            </p>
          </>
        }
        stats={[
          { label: "YOU GET", value: "Eval harness, golden sets, CI gates, model recommendation", small: true },
        ]}
      />

      <CtaStrip
        title="Know what your model can do before your users do."
        href={contactHref}
        label="Scope an eval program"
      />
    </>
  );
}
