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
  H2,
  HairlineGrid,
  Label,
  PageHero,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Done for You",
  description:
    "Our senior engineers scope, build and ship the AI system in your environment. You own the code and IP, and choose whether we hand it over or keep running it.",
};

const positioning = [
  { label: "Your time", body: "A workflow owner, domain expertise and access to your technical and security owners. We agree the time needed up front." },
  { label: "Our team", body: "Senior engineers who scope, build, test and deploy the system end to end." },
  { label: "Your IP", body: "Code, prompts, evals and data live in your accounts from the first commit." },
  { label: "Any stack", body: "We choose models and tools by testing them on your tasks, not by vendor." },
];

const method = [
  { n: "01", title: "Discover", body: "Map the workflow with your operators, test feasibility on real data and agree the measures of success." },
  { n: "02", title: "Build", body: "We write the software in your environment. You review working increments and steer priorities at each checkpoint." },
  { n: "03", title: "Prove", body: "We test quality, controls and recovery. Your workflow owner reviews the evidence and approves production use." },
  { n: "04", title: "Launch", body: "We put it into daily use, train the people who rely on it, and measure it against the agreed baseline." },
];

const afterLaunch = [
  {
    label: "Option A",
    title: "Handover",
    body: "We deliver the code, eval suites, runbooks and decision log, and walk whoever will maintain it through each one.",
    detail: "Best when you have an internal or outsourced team ready to run it.",
  },
  {
    label: "Option B",
    title: "Managed service",
    body: "We monitor the system, re-run evals when models or inputs change, and handle fixes within an agreed support scope.",
    detail: "We keep the handover package current. Support terms and further development are scoped separately.",
  },
];

const goodFit = [
  "You need the outcome more than the in-house capability.",
  "Your engineers are committed elsewhere, or you don't have an engineering team.",
  "The workflow has a named owner who can make decisions quickly.",
  "You want one team accountable for getting it into production.",
];

const otherFit = [
  "You want your engineers to get more from the AI tools they use.",
  "Engineering is core to how you compete.",
  "You can give engineers real time on the project each week.",
];

const commitments = [
  { title: "Domain experts", body: "Operators who know the work, with time each week to show us the exceptions and judge the output." },
  { title: "Access", body: "Access to the systems and representative data the workflow touches, including exceptions, through an agreed access process." },
  { title: "Security from day one", body: "Your security, privacy and compliance owners involved at the start, so controls shape the design instead of blocking launch." },
  { title: "An owner", body: "A named person accountable for the outcome, who can make decisions quickly and owns the system after launch." },
  { title: "A route to production", body: "Somewhere to deploy, and a team ready to train early users and adopt it." },
];

const faqs = [
  {
    q: "What are you accountable for?",
    a: "We own delivery from problem definition through launch. We agree acceptance criteria before building and show the evidence against them before production use.",
  },
  {
    q: "How is this different from staff augmentation?",
    a: "Augmentation adds hands to work you have already defined. We work out what to build, ship it to production and stay accountable for whether it works.",
  },
  {
    q: "Will we end up depending on you?",
    a: "Only if you choose to. The tests, runbooks and decision log live in your systems from the start. You can take the system in-house at handover, or have us run it and move it in-house later.",
  },
  {
    q: "Who owns what we build?",
    a: "You do. Code, prompts, eval suites and runbooks live in your repositories, and your data stays in your environment. We keep only the general methods we bring to every engagement.",
  },
  {
    q: "Are you tied to a model or cloud vendor?",
    a: "No. We don't resell a platform or earn on usage, so we choose models, tools and infrastructure by testing them on your tasks, and build on the stack you already run where it does the job.",
  },
  {
    q: "How do you measure success?",
    a: "Against measures agreed before we build: the business result against its baseline, quality and incident rates in production, and whether the intended people actually use it.",
  },
];

const capabilities = [
  { href: "/forward-deployed", title: "Forward-Deployed Engineers", body: "How we embed with operators to find the problem worth solving." },
  { href: "/model-testing", title: "Model Testing & Evals", body: "How we choose the stack and prove quality before launch." },
  { href: researchHref, title: "Wharf research", body: "Our benchmark of models and agent harnesses on real engineering tasks." },
];

export default function DoneForYouPage() {
  return (
    <>
      <PageHero
        eyebrow="Offering 01 — Done for You"
        title="Hand us the problem. Get working software."
        lede="Our senior engineers scope, build and ship the system in your environment. We provide the delivery team. Your people provide domain judgment, access to system owners and sign-off. You own what we build and choose who runs it after launch."
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

      <Container className="flex flex-col gap-12 py-26">
        <div className="flex max-w-[680px] flex-col gap-3.5">
          <Eyebrow>How it works</Eyebrow>
          <H2>Start with a discovery sprint.</H2>
          <p className="m-0 text-ink-2">
            A fixed-scope first step: map the workflow, test a prototype and decide whether to
            build. You leave with the evidence and a recommendation, even if the answer is no-go.
          </p>
        </div>
        <HairlineGrid min={220} as="ol">
          {method.map((m) => (
            <li key={m.n} className="flex flex-col gap-3 bg-paper p-8">
              <span className="font-mono text-[28px] text-accent">{m.n}</span>
              <h3 className="m-0 text-[21px] font-semibold">{m.title}</h3>
              <p className="m-0 text-ink-2">{m.body}</p>
            </li>
          ))}
        </HairlineGrid>
      </Container>

      <DarkBand>
        <Container className="py-26">
          <div className="flex max-w-[680px] flex-col gap-4 pb-12">
            <Eyebrow dark>After launch</Eyebrow>
            <H2 dark>You decide who runs it.</H2>
            <p className="m-0 text-night-muted">
              Either way, you own the code and IP. Choose at the start, or decide once you have
              seen it in production.
            </p>
          </div>
          <AutoGrid min={320} className="gap-x-14">
            {afterLaunch.map((o) => (
              <div key={o.title} className="flex flex-col gap-3 border-t border-night-line py-9">
                <span className="font-mono text-[13px] text-accent-soft uppercase">{o.label}</span>
                <h3 className="m-0 font-display text-[clamp(26px,3vw,36px)] leading-[1.12] font-normal text-paper">
                  {o.title}
                </h3>
                <p className="m-0 text-night-muted">{o.body}</p>
                <p className="m-0 border-l-2 border-accent-soft pl-4 text-paper">{o.detail}</p>
              </div>
            ))}
          </AutoGrid>
        </Container>
      </DarkBand>

      <Container className="flex flex-col gap-12 py-26">
        <div className="flex max-w-[680px] flex-col gap-3.5">
          <Eyebrow>What we need from you</Eyebrow>
          <H2>Less of your time, but not none of it.</H2>
          <p className="m-0 text-ink-2">
            We agree who needs to be involved and when before the first sprint.
          </p>
        </div>
        <HairlineGrid min={200}>
          {commitments.map((c) => (
            <div key={c.title} className="flex flex-col gap-2.5 bg-paper p-8">
              <h3 className="m-0 text-[21px] font-semibold">{c.title}</h3>
              <p className="m-0 text-ink-2">{c.body}</p>
            </div>
          ))}
        </HairlineGrid>
      </Container>

      <section className="border-y border-line bg-surface">
        <Container className="flex flex-col gap-12 py-26">
          <div className="flex max-w-[680px] flex-col gap-3.5">
            <Eyebrow>Is this the right fit?</Eyebrow>
            <H2>Done for You, or Hands-on Team Enablement?</H2>
          </div>
          <AutoGrid min={320} className="gap-14">
            {[
              { label: "Done for You fits when", items: goodFit },
              { label: "Hands-on Team Enablement instead when", items: otherFit },
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
            <ArrowLink href="/build-with-your-team">See Hands-on Team Enablement</ArrowLink>
          </div>
        </Container>
      </section>

      <EngagementSection
        intro={
          <>
            <H2>What you get</H2>
            <p className="m-0 max-w-[44ch] text-ink-2">
              Every engagement starts with a fixed-scope discovery sprint and a clear go / no-go
              before we build.
            </p>
          </>
        }
        deliverables={[
          { title: "A production system", body: "Running in your environment, in daily use by the people it was built for." },
          { title: "Evals and monitoring", body: "Representative test cases and alerts that say when quality drops." },
          { title: "A handover package", body: "Code, runbooks and the decision log, current whether we run it or you do." },
        ]}
        doneWhen="The system is in daily use, meets the measures agreed at the start, and you have chosen who runs it."
      />

      <section className="border-y border-line">
        <Container className="py-26">
          <AutoGrid min={340} className="items-start gap-14">
            <div className="flex flex-col gap-4">
              <Eyebrow>Questions</Eyebrow>
              <H2>What people ask before the first sprint.</H2>
            </div>
            <div className="flex flex-col border-b border-line">
              {faqs.map((f) => (
                <details key={f.q} className="border-t border-line py-5 text-ink-2">
                  <summary className="cursor-pointer text-[19px] font-medium text-ink">{f.q}</summary>
                  <p className="m-0 mt-3">{f.a}</p>
                </details>
              ))}
            </div>
          </AutoGrid>
        </Container>
      </section>

      <Container className="flex flex-col gap-8 py-26">
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
        title="Tell us which workflow you want off your plate."
        href={contactHref}
        label="Request a discovery call"
      />
    </>
  );
}
