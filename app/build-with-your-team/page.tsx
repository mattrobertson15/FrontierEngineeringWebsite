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
  title: "Hands-on Team Enablement",
  description:
    "Help your engineers get more from AI. We teach our engineering practices through pairing, code review and hands-on work in your codebase.",
};

const positioning = [
  { label: "Your time", body: "Engineers with time to learn and apply the practices to their work." },
  { label: "Our team", body: "Senior engineers who teach through pairing, code review and practical examples." },
  { label: "A real project", body: "We work on your existing codebase or a new project your team wants to ship." },
  { label: "Your practice", body: "Practices adapted to your team and documented in your repositories." },
];

const learningSteps = [
  ["01", "Understand how you use AI today", "together"],
  ["02", "Choose the practices to work on", "together"],
  ["03", "Teach through real changes", "we pair"],
  ["04", "Apply the practices to your work", "you lead"],
  ["05", "Review progress and document what works", "together"],
];

const skills = [
  { tag: "/specs", title: "Spec-driven development", body: "Writing clear tasks and acceptance criteria so people and agents know what to build." },
  { tag: "/repo", title: "Agent-ready codebases", body: "Context files, module boundaries and fast tests so agents do real work safely." },
  { tag: "/tools", title: "Choosing and using agents", body: "Choosing tools for your tasks, giving agents useful context and knowing when to step in." },
  { tag: "/review", title: "Reviewing AI-written code", body: "Checking the design, behavior and maintainability of a change before it ships." },
  { tag: "/tests", title: "Testing and verification", body: "Using tests, CI and independent checks to verify agent work. Adding evals when the product uses models." },
  { tag: "/workflow", title: "Making the practices stick", body: "Building what works into planning, code review and everyday development." },
];

const goodFit = [
  "Your engineers use AI, or are getting started, and want to get more from it.",
  "You want practical guidance on specs, agents, testing and review.",
  "You can give a team real time on the project each week.",
  "You want your team to keep using the practices after we leave.",
];

const otherFit = [
  "Your engineers are committed elsewhere, or you do not have an engineering team.",
  "You need one team accountable for delivery itself.",
  "You would rather we keep running the system after launch.",
];

const capabilities = [
  { href: "/engineering", title: "AI-Native Engineering", body: "The codebase, spec and review practices we set up with your team." },
  { href: "/playbook", title: "AI-Native Playbook", body: "The working rules we teach, published in full." },
  { href: "/model-testing", title: "Model Testing & Evals", body: "How we evaluate models when your product depends on them." },
  { href: researchHref, title: "Wharf research", body: "Our benchmark of models and agent harnesses on real engineering tasks." },
];

export default function BuildWithYourTeamPage() {
  return (
    <>
      <PageHero
        eyebrow="Offering 02 — Hands-on Team Enablement"
        title="Help your engineers get more from AI."
        lede="Your team may already use AI every day. We teach the engineering practices that help them achieve more, through pairing, code review and hands-on work in your codebase. The project can be any software your team builds."
      />

      <section className="border-y border-line bg-surface">
        <Container className="py-18">
          <AutoGrid min={240} className="gap-10">
            {positioning.map((p) => (
              <div key={p.label} className="flex flex-col gap-2.5">
                <Label>{p.label}</Label>
                <p className="m-0 text-xl leading-[1.4] font-medium">{p.body}</p>
              </div>
            ))}
          </AutoGrid>
        </Container>
      </section>

      <DarkBand>
        <Container className="py-26">
          <AutoGrid min={320} className="items-start gap-14">
            <div className="flex flex-col gap-4">
              <Eyebrow dark>How it works</Eyebrow>
              <H2 dark>Learn together. Apply it to your work.</H2>
              <p className="m-0 text-night-muted">
                We start with how your team works today and choose the practices that will help most.
                We agree the scope, time commitment and checkpoints up front, then teach and
                review as your engineers apply them to real changes.
              </p>
            </div>
            <ol className="m-0 flex list-none flex-col border-b border-night-line p-0 font-mono text-[15px]">
              {learningSteps.map(([n, step, who]) => (
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

      <Container className="flex flex-col gap-12 py-26">
        <div className="flex max-w-[680px] flex-col gap-3.5">
          <Eyebrow>What your team learns</Eyebrow>
          <H2>Practical habits for better engineering with AI.</H2>
        </div>
        <HairlineGrid>
          {skills.map((s) => (
            <FeatureCard key={s.tag} tag={s.tag} title={s.title}>
              {s.body}
            </FeatureCard>
          ))}
        </HairlineGrid>
      </Container>

      <section className="border-y border-line bg-surface">
        <Container className="flex flex-col gap-12 py-26">
          <div className="flex max-w-[680px] flex-col gap-3.5">
            <Eyebrow>Is this the right fit?</Eyebrow>
            <H2>Hands-on Team Enablement, or Done for You?</H2>
          </div>
          <AutoGrid min={320} className="gap-14">
            {[
              { label: "Hands-on Team Enablement fits when", items: goodFit },
              { label: "Done for You instead when", items: otherFit },
            ].map((col) => (
              <div key={col.label} className="flex flex-col gap-4">
                <Label>{col.label}</Label>
                <ul className="m-0 flex list-none flex-col border-b border-line p-0">
                  {col.items.map((item) => (
                    <li key={item} className="border-t border-line py-4 text-ink-2">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </AutoGrid>
          <div>
            <ArrowLink href="/done-for-you">See Done for You</ArrowLink>
          </div>
        </Container>
      </section>

      <EngagementSection
        intro={
          <>
            <H2>What you get</H2>
            <p className="m-0 max-w-[44ch] text-ink-2">
              We focus on the practices your team needs and apply them to a bounded piece of
              real work. We review progress against the goals we agreed at the start.
            </p>
          </>
        }
        deliverables={[
          { title: "Hands-on learning", body: "Pairing and review on real changes, with feedback your engineers can use immediately." },
          { title: "A better development workflow", body: "Improvements to context, specs, tests and review that fit your codebase." },
          { title: "Your team playbook", body: "Examples and conventions your engineers can use and share, written down in the repo." },
        ]}
        doneWhen="Your engineers can apply the agreed practices to a change, verify the result and explain their decisions without our guidance."
      />

      <Container className="flex flex-col gap-8 pb-26">
        <Label>Capabilities we draw on</Label>
        <ul className="m-0 list-none border-b border-line p-0">
          {capabilities.map((c) => (
            <li key={c.href} className="border-t border-line py-6">
              <div className="grid gap-2 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-baseline md:gap-12">
                <ArrowLink href={c.href}>{c.title}</ArrowLink>
                <p className="m-0 text-ink-2">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>

      <CtaStrip
        title="Bring your team and the work you want to improve."
        href={contactHref}
        label="Request a discovery call"
      />
    </>
  );
}
