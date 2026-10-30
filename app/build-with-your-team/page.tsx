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
  title: "Build with Your Team",
  description:
    "Our senior engineers work inside your team on a real project, pairing, reviewing and teaching, so your engineers ship a production AI system and can build the next one without us.",
};

const positioning = [
  { label: "Your time", body: "Engineers assigned to the project and a workflow owner. This is real work, not training on the side." },
  { label: "Our team", body: "Senior engineers who pair, review, coach and set up the tooling." },
  { label: "A real project", body: "Your team learns on a system you will ship, not a toy exercise." },
  { label: "Your practice", body: "Specs, conventions and eval habits written into your repositories." },
];

const handoffSteps = [
  ["01", "Assess the codebase, workflow and skills", "us"],
  ["02", "Set up the repo, CI and eval gates", "us · you pair"],
  ["03", "Build the first increments", "us · you pair"],
  ["04", "Build the rest of the pilot", "you · we review"],
  ["05", "Ship and operate it", "you · we coach"],
  ["06", "Start the next project", "you"],
];

const skills = [
  { tag: "/specs", title: "Spec-driven development", body: "Turning a workflow into reviewable specs with acceptance criteria that people and agents build against." },
  { tag: "/repo", title: "Agent-ready codebases", body: "Context files, module boundaries and fast tests so agents do real work safely." },
  { tag: "/evals", title: "Evals and model selection", body: "Building test sets with your domain experts and choosing a stack by evidence." },
  { tag: "/review", title: "Review at agent speed", body: "Risk-tiered review and eval-gated CI, so more output doesn't mean more bugs." },
  { tag: "/ops", title: "Running AI in production", body: "Monitoring, drift detection, runbooks and recovery for systems that depend on models." },
  { tag: "/scope", title: "Finding the next opportunity", body: "Scoring workflows by value, data availability and risk, so your team picks its next project well." },
];

const goodFit = [
  "You have engineers and want them to own AI work long term.",
  "Engineering capability is part of how you compete.",
  "You can give a team real time on the project each week.",
  "You want a working system and a team that can repeat it.",
];

const otherFit = [
  "No engineers are available, or the project can't wait for them to ramp up.",
  "You need one team accountable for delivery itself.",
  "You would rather we keep running the system after launch.",
];

const capabilities = [
  { href: "/engineering", title: "AI-Native Engineering", body: "The codebase, spec and review practices we set up with your team." },
  { href: "/playbook", title: "AI-Native Playbook", body: "The working rules we teach, published in full." },
  { href: "/model-testing", title: "Model Testing & Evals", body: "How your team learns to measure quality and choose a stack." },
  { href: researchHref, title: "Wharf research", body: "Our benchmark of models and agent harnesses on real engineering tasks." },
];

export default function BuildWithYourTeamPage() {
  return (
    <>
      <PageHero
        eyebrow="Offering 02 — Build with Your Team"
        title="Your engineers build it. We build it with them."
        lede="We work inside your team on a real project, pairing, reviewing and teaching. Your engineers ship a production AI system and finish able to build the next one without us."
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
              <H2 dark>We lead at the start. Your team leads by the end.</H2>
              <p className="m-0 text-night-muted">
                The work moves from our hands to yours one stage at a time. Each handoff happens
                when your engineers are ready, not on a fixed date, and we agree the exit criteria
                before we start.
              </p>
            </div>
            <ol className="m-0 flex list-none flex-col border-b border-night-line p-0 font-mono text-[15px]">
              {handoffSteps.map(([n, step, who]) => (
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
          <H2>The skills to do it again without us.</H2>
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
            <H2>Build with Your Team, or Done for You?</H2>
          </div>
          <AutoGrid min={320} className="gap-14">
            {[
              { label: "Build with Your Team fits when", items: goodFit },
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
              We start with one team and one pilot project, then help you take the practice to
              the next team with your engineers leading.
            </p>
          </>
        }
        deliverables={[
          { title: "A shipped pilot", body: "A production system your engineers built and now run." },
          { title: "An agent-ready repo with eval-gated CI", body: "The tooling your team uses for every project after this one." },
          { title: "Your team playbook", body: "Conventions for specs, review, evals and agent permissions, written down in the repo." },
        ]}
        doneWhen="Your engineers have shipped the pilot and can make and deploy the next change without us."
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
        title="Bring a project. Leave with a team that can ship the next one."
        href={contactHref}
        label="Request a discovery call"
      />
    </>
  );
}
