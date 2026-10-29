import type { Metadata } from "next";
import { contactHref, researchHref } from "@/lib/site";
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
  Label,
  PageHero,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "AI-Native Engineering",
  description:
    "Rebuild how software gets made around agents: agent-ready codebases, spec-driven development, eval-gated CI and review pipelines that scale.",
};

const features = [
  { tag: "/repo", title: "Agent-ready codebases", body: "Context files, module boundaries, fast deterministic tests and scripts an agent can run end to end without guessing." },
  { tag: "/specs", title: "Spec-driven development", body: "Work starts as a reviewable spec with acceptance criteria — the contract both humans and agents build against." },
  { tag: "/review", title: "Review pipelines that scale", body: "Automated first-pass review, risk-tiered approvals and clear ownership, so more output doesn't mean more bugs." },
  { tag: "/ci", title: "CI with eval gates", body: "Any change that touches a prompt, model or agent runs its eval suite before merge, just like unit tests." },
  { tag: "/agents", title: "Background & parallel agents", body: "Safe sandboxes, permissions and task queues so agents can run long jobs while engineers keep their focus." },
  { tag: "/team", title: "Team enablement", body: "Pairing, workshops and new rituals — planning, estimation and code review rewritten for an agent-assisted team." },
];

const loopSteps = [
  ["01", "Research the codebase", "agent"],
  ["02", "Spec & acceptance criteria", "human"],
  ["03", "Plan, then approve", "agent → human"],
  ["04", "Implement in bounded sessions", "agent"],
  ["05", "Verify independently", "CI"],
  ["06", "Review & merge", "human"],
  ["07", "Observe in production", "telemetry"],
];

export default function EngineeringPage() {
  return (
    <>
      <PageHero
        eyebrow="Practice 01 — AI-native engineering"
        title="Rebuild how software gets made — around agents."
        lede="Giving engineers a coding assistant is the easy part. We redesign the codebase, the workflow and the review process so agents can do real work safely — and your team ships more of what matters."
      />

      <section className="border-y border-line bg-surface">
        <Container className="py-18">
          <AutoGrid min={320} className="gap-12">
            <div className="flex flex-col gap-3">
              <Label>The problem</Label>
              <p className="m-0 text-2xl leading-[1.35] font-medium tracking-[-0.015em]">
                Most teams bolt AI onto a process designed for humans typing every line — and get
                faster typing, not faster delivery.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Label>The shift</Label>
              <p className="m-0 text-2xl leading-[1.35] font-medium tracking-[-0.015em]">
                AI-native teams write specs, context and tests first. Agents produce the code;
                engineers design, review and own it.
              </p>
            </div>
          </AutoGrid>
        </Container>
      </section>

      <Container className="flex flex-col gap-12 py-26">
        <H2>What we put in place</H2>
        <HairlineGrid>
          {features.map((f) => (
            <FeatureCard key={f.tag} tag={f.tag} title={f.title}>
              {f.body}
            </FeatureCard>
          ))}
        </HairlineGrid>
      </Container>

      <DarkBand>
        <Container className="py-26">
          <AutoGrid min={320} className="items-start gap-14">
            <div className="flex flex-col gap-4">
              <Eyebrow dark>The AI-native loop</Eyebrow>
              <H2 dark>Humans decide. Agents execute. Tests arbitrate.</H2>
              <p className="m-0 text-night-muted">
                Every change moves through the same loop, whether a person or an agent wrote it.
                Understanding comes before code, and the agent never grades its own work — tests
                run separately, and a claimed fix only counts once they pass.
              </p>
            </div>
            <ol className="m-0 flex list-none flex-col border-b border-night-line p-0 font-mono text-[15px]">
              {loopSteps.map(([n, step, who]) => (
                <li key={n} className="grid grid-cols-[48px_1fr_auto] gap-3 border-t border-night-line py-[18px]">
                  <span className="text-accent-soft">{n}</span>
                  <span className="text-paper">{step}</span>
                  <span className="text-night-dim">{who}</span>
                </li>
              ))}
            </ol>
          </AutoGrid>
        </Container>
      </DarkBand>

      <section className="border-b border-line bg-surface">
        <Container className="py-18">
          <AutoGrid min={320} className="items-center gap-12">
            <div className="flex flex-col gap-3">
              <Label>Built with the same discipline we measure</Label>
              <p className="m-0 text-2xl leading-[1.35] font-medium tracking-[-0.015em]">
                Our Wharf benchmark runs coding agents through thousands of independently verified
                attempts — the same loop, applied to the agents themselves.
              </p>
            </div>
            <div>
              <ArrowLink href={researchHref}>See the Wharf research</ArrowLink>
            </div>
          </AutoGrid>
        </Container>
      </section>

      <EngagementSection
        intro={
          <>
            <H2>Typical engagement</H2>
            <p className="m-0 max-w-[44ch] text-ink-2">
              We start with one team and one codebase, prove the model, then scale it across the
              organization with your engineers leading.
            </p>
          </>
        }
        stats={[
          { label: "YOU GET", value: "Agent-ready repo, eval-gated CI, team playbook", small: true },
        ]}
      />

      <CtaStrip
        title="See where your codebase stands today."
        href={contactHref}
        label="Request an AI-readiness review"
      />
    </>
  );
}
