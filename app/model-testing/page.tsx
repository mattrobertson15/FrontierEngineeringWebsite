import type { Metadata } from "next";
import { contactHref } from "@/lib/site";
import {
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

const benchmarkSource = "https://github.com/bartr/wharf";

// DeepSWE PASS@1 and mean cost per costed attempt, from the Wharf results export.
const report = [
  { model: "GPT-5.6 Luna", harness: "Copilot", pass: "74.1%", cost: "$0.37", tone: "best" },
  { model: "Gemini 3.8 Flash", harness: "Copilot", pass: "74.1%", cost: "$2.79" },
  { model: "Claude Opus 5", harness: "Copilot", pass: "71.2%", cost: "$5.66" },
  { model: "GPT-6 Astra", harness: "Copilot", pass: "71.0%", cost: "$8.43" },
  { model: "Claude Opus 5.5", harness: "Copilot", pass: "70.8%", cost: "$11.98" },
  { model: "Claude Opus 5", harness: "Claude Code", pass: "64.4%", cost: "$13.49" },
  { model: "Auto", harness: "Copilot", pass: "37.0%", cost: "$1.62", tone: "worst" },
];

const findings = [
  { tag: "harness", title: "Same model, different harness, different result.", body: "Claude Opus 5 passed 71.2% of attempts inside GitHub Copilot and 64.4% inside Claude Code — and cost 58% less per task ($5.66 vs $13.49)." },
  { tag: "cost", title: "The cheapest model tied for first.", body: "GPT-5.6 Luna passed 74.1% at $0.37 per task — about 1/32 the cost of Claude Opus 5.5, which scored 70.8%." },
  { tag: "upgrade", title: "Version bumps move the numbers.", body: "Luna fell from 74.1% to 69.9% between two Copilot CLI releases with no change to the model. That is the regression an eval gate catches before rollout." },
  { tag: "reproduce", title: "Results that hold up.", body: "Where our configurations overlap Meta's published DeepSWE evaluation, our pass counts land within about three passes in 565 attempts." },
];

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
  const cell = "border-b border-[#22272A] px-2 py-2.5";
  return (
    <figure className="m-0 flex flex-col gap-4 bg-ink p-6 font-mono text-[13px] text-night-text">
      <div className="flex justify-between gap-4 text-night-dim">
        <span>deepswe · 113 tasks</span>
        <span>oct 2026</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] border-collapse">
          <thead>
            <tr className="text-left text-night-dim">
              {["model", "harness", "pass@1", "$/task"].map((h) => (
                <th key={h} className="border-b border-night-line px-2 py-2.5 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.map((r) => (
              <tr
                key={`${r.model}-${r.harness}`}
                className={r.tone === "best" ? "text-accent-soft" : r.tone === "worst" ? "text-warn-soft" : undefined}
              >
                <td className={cell}>{r.model}</td>
                <td className={cell}>{r.harness}</td>
                <td className={cell}>{r.pass}</td>
                <td className={cell}>{r.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="text-night-dim">
        Max reasoning effort, 4–5 attempts per task. Cost is the mean per attempt.{" "}
        <a href={benchmarkSource} className="underline hover:text-paper">
          Methodology &amp; raw data
        </a>
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
            <H2>16 agent configurations. 7,500+ attempts at real engineering tasks.</H2>
            <p className="m-0 max-w-[60ch] text-ink-2">
              We ran today&apos;s frontier models through DeepSWE — 113 real-world software tasks,
              each attempted four or five times — and graded every attempt against its tests. The
              leaderboard wasn&apos;t the interesting part.
            </p>
          </div>
          <HairlineGrid min={260}>
            {findings.map((f) => (
              <FeatureCard key={f.tag} tag={f.tag} title={f.title}>
                {f.body}
              </FeatureCard>
            ))}
          </HairlineGrid>
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
          { label: "DURATION", value: "[WEEKS]" },
          { label: "SCOPE", value: "[USE CASES]" },
          { label: "YOU GET", value: "Eval harness, golden sets, CI gates, model recommendation", small: true },
          { label: "INVESTMENT", value: "[YOUR PRICE]" },
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
