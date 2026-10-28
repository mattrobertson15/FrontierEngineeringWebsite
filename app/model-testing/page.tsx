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

const report = [
  { suite: "task_accuracy", gate: "pass" },
  { suite: "grounding", gate: "pass" },
  { suite: "safety_redteam", gate: "review" },
  { suite: "latency_p95", gate: "pass" },
  { suite: "cost_per_task", gate: "pass" },
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
      <div className="flex justify-between text-night-dim">
        <span>eval_report · release candidate</span>
        <span>sample layout</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] border-collapse">
          <thead>
            <tr className="text-left text-night-dim">
              {["suite", "cases", "baseline", "candidate", "gate"].map((h) => (
                <th key={h} className="border-b border-night-line px-2 py-2.5 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.map((r) => (
              <tr key={r.suite}>
                <td className={cell}>{r.suite}</td>
                <td className={cell}>[n]</td>
                <td className={cell}>[x]</td>
                <td className={cell}>[y]</td>
                <td className={`${cell} ${r.gate === "pass" ? "text-accent-soft" : "text-warn-soft"}`}>
                  {r.gate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="text-night-dim">
        Every release ships with a report like this. Values shown are placeholders.
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
