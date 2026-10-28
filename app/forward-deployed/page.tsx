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
    "Senior engineers who embed with your teams, find where AI changes the economics, build the tool and stay until it runs.",
};

const positioning = [
  { label: "Not consultants", body: "They write production code, not recommendations." },
  { label: "Not a dev shop", body: "They decide what to build by finding the problem first." },
  { label: "Not a pilot factory", body: "Success is a tool in daily use, measured against a baseline." },
];

const method = [
  { n: "01", title: "Shadow", body: "Sit with operators. Record every task, handoff, workaround and spreadsheet." },
  { n: "02", title: "Score", body: "Rank tasks by volume, cost, error rate, data availability and risk of getting it wrong." },
  { n: "03", title: "Spike", body: "Build quick technical probes on the top candidates to test feasibility on real data." },
  { n: "04", title: "Ship", body: "Take the winner to production with evals, monitoring and a named owner on your side." },
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
            teams. They watch how work actually gets done, find where AI changes the economics, and
            build the tool — then stay until it runs.
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

      <Container className="flex flex-col gap-12 py-26">
        <div className="flex max-w-[680px] flex-col gap-3.5">
          <Eyebrow>The discovery method</Eyebrow>
          <H2>How we find the opportunities worth building</H2>
        </div>
        <HairlineGrid min={240} as="ol">
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

      <EngagementSection
        intro={
          <>
            <H2>The discovery sprint</H2>
            <p className="m-0 max-w-[44ch] text-ink-2">
              A fixed-scope first engagement. Low commitment, concrete output — and a clear answer
              on whether to go further.
            </p>
          </>
        }
        stats={[
          { label: "DURATION", value: "[WEEKS]" },
          { label: "ON SITE", value: "[FDE COUNT]" },
          { label: "YOU GET", value: "Ranked opportunity map + working prototype", small: true },
          { label: "INVESTMENT", value: "[YOUR PRICE]" },
        ]}
      />

      <CtaStrip
        title="Put an engineer next to your hardest workflow."
        href={contactHref}
        label="Start a discovery sprint"
      />
    </>
  );
}
