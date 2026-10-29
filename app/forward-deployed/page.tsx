import type { Metadata } from "next";
import { contactHref } from "@/lib/site";
import {
  AutoGrid,
  Container,
  CtaStrip,
  DarkBand,
  EngagementSection,
  Eyebrow,
  H1,
  H2,
  HairlineGrid,
  Label,
  Lede,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Forward-Deployed Engineers",
  description:
    "Senior engineers who embed with your teams, identify where AI can reduce costs or improve outcomes, build the tool and stay until your team can run it without us.",
};

const positioning = [
  { label: "Embedded engineers", body: "Engineers work alongside your team, from problem definition through delivery." },
  { label: "Production delivery", body: "The team identifies the problem, writes the code and puts it into daily use." },
  { label: "Measured outcomes", body: "Success is a tool in daily use, measured against an agreed baseline." },
];

const gapQuestions = [
  "Which workflow or decision should actually change?",
  "Which data and systems are the source of truth?",
  "Where does a person still have to make the call?",
  "How will anyone know when quality drops?",
  "Who owns it when the model, the policy or the process changes?",
];

const method = [
  { n: "01", title: "Shadow", body: "Sit with operators. Record every task, handoff, workaround and spreadsheet." },
  { n: "02", title: "Score", body: "Rank tasks by volume, cost, error rate, data availability and risk of getting it wrong." },
  { n: "03", title: "Spike", body: "Build quick technical probes on the top candidates to test feasibility on real data." },
  { n: "04", title: "Ship", body: "Take the winner to production with evals, monitoring and a named owner on your side." },
  { n: "05", title: "Hand off", body: "Pair with your owners and rehearse recovery. We leave when your engineers can ship a change without us." },
];

const handoff = [
  { title: "The code", body: "Production code and infrastructure definitions, in your repositories." },
  { title: "The evals", body: "Representative cases and eval suites that say when it breaks." },
  { title: "The judgment", body: "Your operators' rules and exceptions as tested, versioned instructions — not knowledge in a consultant's head." },
  { title: "The runbooks", body: "Monitoring, alerts, recovery procedures and escalation paths." },
  { title: "The decisions", body: "Why it was built this way, what was ruled out, and the known limits." },
  { title: "The owner", body: "A named owner on your side, trained by pairing, with a prioritized backlog." },
];

const goodFit = [
  "The outcome matters enough to need production-grade engineering.",
  "The path to it isn't known yet — the answer is somewhere on the floor.",
  "The knowledge is spread across operations, data, security and engineering.",
  "It has to fit the systems and controls you already have.",
  "You want to own it at the end, not rent us forever.",
];

const poorFit = [
  "The requirement is already clear and a delivery team can just build it.",
  "An off-the-shelf product does the job with routine setup.",
  "You need extra coding capacity, not someone to find the problem.",
  "No one owns the process, or there is no route to production.",
];

const faqs = [
  {
    q: "How is this different from consulting?",
    a: "Consulting often stops at the recommendation. Our engineers frame the problem, write the code, put it into production and measure it — one team, accountable for the result rather than the roadmap.",
  },
  {
    q: "How is this different from staff augmentation?",
    a: "Augmentation adds hands to work you have already defined. A forward-deployed team works out what to build, ships a bounded piece of it to production, and builds your team's ability to own it.",
  },
  {
    q: "Will we end up depending on you?",
    a: "Not by design. Exit criteria are agreed at the start, your owners pair with us throughout, and the tests, runbooks and decisions live in your systems. The engagement is done when your team can make and safely deploy a change on its own.",
  },
  {
    q: "How do you measure success?",
    a: "Against measures agreed before we build: the business result against its baseline, quality and incident rates in production, whether the intended people actually use it, and whether your team can run it without us.",
  },
];

const domains = [
  ["Operations", "Intake, triage, exception handling"],
  ["Finance", "Reconciliation, close, audit prep"],
  ["Customer support", "Resolution, routing, QA"],
  ["Sales & RevOps", "Research, proposals, CRM hygiene"],
  ["Legal & compliance", "Review, extraction, policy checks"],
  ["Engineering", "Internal tools, migrations, on-call"],
];

export default function ForwardDeployedPage() {
  return (
    <>
      <Container className="pt-24 pb-18">
        <AutoGrid min={340} className="items-end gap-14">
          <div className="flex flex-col gap-6">
            <Eyebrow>Practice 02 — Forward-deployed engineers</Eyebrow>
            <H1>Engineers in the room where the work happens.</H1>
          </div>
          <Lede>
            Our forward-deployed engineers embed with your operations, finance, support or sales
            teams. They watch how work gets done, identify where AI can reduce costs or improve
            outcomes, and build the tool — then stay until your team can run it without us.
          </Lede>
        </AutoGrid>
      </Container>

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

      <Container className="pt-26">
        <AutoGrid min={340} className="items-start gap-14">
          <div className="flex flex-col gap-4">
            <Eyebrow>The deployment gap</Eyebrow>
            <H2>Demos don&apos;t stall on the model. They stall on the business.</H2>
            <p className="m-0 text-ink-2">
              A model can be capable and a prototype impressive while nothing changes. Production
              asks the hard questions, and they can only be answered next to the people doing the
              work. That is where we sit.
            </p>
          </div>
          <ul className="m-0 flex list-none flex-col border-b border-line p-0">
            {gapQuestions.map((q) => (
              <li key={q} className="border-t border-line py-[18px] text-[19px] font-medium">
                {q}
              </li>
            ))}
          </ul>
        </AutoGrid>
      </Container>

      <Container className="flex flex-col gap-12 py-26">
        <div className="flex max-w-[680px] flex-col gap-3.5">
          <Eyebrow>The method</Eyebrow>
          <H2>From your team’s workflow to software they own</H2>
        </div>
        <HairlineGrid min={200} as="ol">
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
          <AutoGrid min={320} className="gap-14">
            <div className="flex flex-col gap-4">
              <Eyebrow dark>Where we deploy</Eyebrow>
              <H2 dark>The workflows that run your business.</H2>
              <p className="m-0 text-night-muted">
                Wherever skilled people spend hours on reading, routing, reconciling or writing —
                that&apos;s where we look first.
              </p>
            </div>
            <AutoGrid min={200} as="ul" className="m-0 list-none gap-x-8 p-0">
              {domains.map(([name, detail]) => (
                <li key={name} className="border-t border-night-line py-[18px]">
                  <span className="font-semibold text-paper">{name}</span>
                  <br />
                  <span className="text-[15px] text-night-muted">{detail}</span>
                </li>
              ))}
            </AutoGrid>
          </AutoGrid>
        </Container>
      </DarkBand>

      <Container className="flex flex-col gap-12 py-26">
        <div className="flex max-w-[680px] flex-col gap-3.5">
          <Eyebrow>What you keep</Eyebrow>
          <H2>Everything it takes to run it without us.</H2>
        </div>
        <HairlineGrid min={300}>
          {handoff.map((h) => (
            <div key={h.title} className="flex flex-col gap-2.5 bg-paper p-8">
              <h3 className="m-0 text-[21px] font-semibold">{h.title}</h3>
              <p className="m-0 text-ink-2">{h.body}</p>
            </div>
          ))}
        </HairlineGrid>
      </Container>

      <section className="border-y border-line bg-surface">
        <Container className="flex flex-col gap-12 py-26">
          <div className="flex max-w-[680px] flex-col gap-3.5">
            <Eyebrow>Is this the right fit?</Eyebrow>
            <H2>Not every problem needs an engineer in the room.</H2>
          </div>
          <AutoGrid min={320} className="gap-14">
            {[
              { label: "A good fit when", items: goodFit },
              { label: "Hire someone else when", items: poorFit },
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
        </Container>
      </section>

      <EngagementSection
        intro={
          <>
            <H2>The discovery sprint</H2>
            <p className="m-0 max-w-[44ch] text-ink-2">
              A fixed-scope first engagement. Low commitment, concrete output — and a clear go /
              no-go on building the top candidate.
            </p>
          </>
        }
        deliverables={[
          { title: "A ranked opportunity map", body: "Every task we found, scored by volume, cost, data availability and risk." },
          { title: "A working prototype", body: "The top candidate, running on your real data in front of the people who'd use it." },
          { title: "A go / no-go recommendation", body: "Whether to build it, with the baseline and evals to judge it by." },
        ]}
        doneWhen="You have a clear decision on the top candidate and the evidence to back it."
      />

      <section className="border-t border-line">
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

      <CtaStrip
        title="Put an engineer next to your hardest workflow."
        href={contactHref}
        label="Request a discovery call"
      />
    </>
  );
}
