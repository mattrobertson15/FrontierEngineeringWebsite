import type { Metadata } from "next";
import { contactHref, researchHref } from "@/lib/site";
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
  Label,
  PageHero,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "AI-Native Engineering",
  description:
    "Practical engineering with AI: clear specs, useful context, testing and code review, taught hands-on in your codebase.",
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
        eyebrow="Hands-on Team Enablement — AI-native engineering"
        title="Better engineering practices for working with AI."
        lede="Already using coding agents? We help your engineers get more from them by teaching how we write specs, prepare codebases, test changes and review AI-written code. We work alongside your team and adapt the practices to your work."
      />

      <section className="border-y border-line bg-surface">
        <Container className="py-18">
          <AutoGrid min={320} className="gap-12">
            <div className="flex flex-col gap-3">
              <Label>The problem</Label>
              <p className="m-0 text-2xl leading-[1.35] font-medium tracking-[-0.015em]">
                Writing more code is only part of the work. Clear tasks, useful context and
                thorough review help turn agent output into changes you can ship.
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
        <H2>The practices we teach</H2>
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
                Our Wharf benchmark evaluates coding agents with repeated attempts and a separate
                verifier. Missing attempts count as failures.
              </p>
            </div>
            <div>
              <ArrowLink href={researchHref}>See the Wharf research</ArrowLink>
            </div>
          </AutoGrid>
        </Container>
      </section>

      <Container className="py-26">
        <AutoGrid min={320} className="items-end gap-12">
          <div className="flex flex-col gap-4">
            <Eyebrow>How to get it</Eyebrow>
            <H2>Offered as part of Hands-on Team Enablement.</H2>
          </div>
          <div className="flex flex-col gap-4">
            <p className="m-0 max-w-[44ch] text-ink-2">
              We teach through pairing and review in your codebase, building on the tools and
              practices your engineers already use.
            </p>
            <div>
              <ArrowLink href="/build-with-your-team">See Hands-on Team Enablement</ArrowLink>
            </div>
          </div>
        </AutoGrid>
      </Container>

      <CtaStrip
        title="See where your codebase stands today."
        href={contactHref}
        label="Request a discovery call"
      />
    </>
  );
}
