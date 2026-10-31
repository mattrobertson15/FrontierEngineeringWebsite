import type { Metadata } from "next";
import { careersEmail, researchHref } from "@/lib/site";
import {
  ArrowLink,
  AutoGrid,
  Container,
  DarkBand,
  Eyebrow,
  H2,
  HairlineGrid,
  Label,
  PageHero,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join Frontier Engineering. We're growing our team of forward-deployed engineers and taking on research interns.",
};

const principles = [
  { tag: "field", title: "Work next to the problem", body: "You sit with the people doing the work, not three layers away from them. The best answers come from watching how work actually gets done." },
  { tag: "ship", title: "Ship to production", body: "Success is a tool in daily use, measured against a baseline, not a demo or a slide deck." },
  { tag: "evidence", title: "Decide by evidence", body: "We pick models and tools by testing them on real work, and we publish what we find." },
  { tag: "handoff", title: "Leave people stronger", body: "Every engagement ends with a client team that can run and extend what we built." },
];

const roles = [
  {
    id: "forward-deployed-engineer",
    title: "Forward-Deployed Engineer",
    type: "Full-time",
    summary:
      "Embed with client teams in operations, finance, support and sales. Find where AI can reduce costs or improve outcomes, then build the tool and put it into daily use.",
    doing: [
      "Shadow operators and map every task, handoff and workaround.",
      "Rank opportunities and build quick technical probes on real data.",
      "Take the winner to production with evals, monitoring and a named owner.",
      "Train the client team that will run it, and write down what you learned.",
    ],
    lookingFor: [
      "Strong software engineering. You've shipped and run production systems.",
      "Hands-on experience building with LLMs and agents.",
      "Comfort working directly with non-technical stakeholders.",
      "Judgment about when not to build something.",
    ],
  },
  {
    id: "research-intern",
    title: "Research Intern",
    type: "Internship",
    summary:
      "Help us test models and agent harnesses on real engineering tasks, and turn the results into evidence clients use to choose their stack.",
    doing: [
      "Design and run benchmark experiments across models and harnesses.",
      "Build eval suites, graders and analysis tooling.",
      "Separate real effects from run-to-run noise.",
      "Write up findings for publication alongside our engineers.",
    ],
    lookingFor: [
      "Studying computer science, ML or a related field, or equivalent experience.",
      "Solid programming and comfort with data analysis.",
      "Curiosity about how models behave in practice, not only on leaderboards.",
      "Clear, careful writing.",
    ],
  },
];

function mailto(role: string) {
  return `mailto:${careersEmail}?subject=${encodeURIComponent(`Careers: ${role}`)}`;
}

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Build AI systems people actually use."
        lede="We're growing. We'll mostly be hiring forward-deployed engineers, plus research interns. If you'd like to join us, get in touch."
      />

      <section className="border-y border-line bg-surface">
        <Container className="flex flex-col gap-12 py-26">
          <div className="flex max-w-[680px] flex-col gap-3.5">
            <Eyebrow>How we work</Eyebrow>
            <H2>Engineers who own the outcome.</H2>
          </div>
          <HairlineGrid min={260}>
            {principles.map((p) => (
              <div key={p.tag} className="flex flex-col gap-3 bg-paper p-8">
                <span className="font-mono text-[13px] text-accent-ink">{p.tag}</span>
                <h3 className="m-0 text-[21px] font-semibold">{p.title}</h3>
                <p className="m-0 text-ink-2">{p.body}</p>
              </div>
            ))}
          </HairlineGrid>
        </Container>
      </section>

      <Container className="flex flex-col gap-12 py-26">
        <div className="flex max-w-[680px] flex-col gap-3.5">
          <Eyebrow>Roles</Eyebrow>
          <H2>Who we&apos;re looking for</H2>
        </div>
        <div className="flex flex-col gap-px border border-line bg-line">
          {roles.map((r) => (
            <article id={r.id} key={r.id} className="flex scroll-mt-8 flex-col gap-8 bg-paper p-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex max-w-[640px] flex-col gap-3">
                  <span className="font-mono text-[13px] text-accent-ink">{r.type}</span>
                  <h3 className="m-0 text-[28px] font-semibold">{r.title}</h3>
                  <p className="m-0 text-ink-2">{r.summary}</p>
                </div>
                <a
                  href={mailto(r.title)}
                  className="inline-flex min-h-12 items-center bg-accent px-[22px] font-medium text-white transition-colors hover:bg-ink"
                >
                  Get in touch
                </a>
              </div>
              <AutoGrid min={300} className="gap-10">
                {[
                  { label: "What you'll do", items: r.doing },
                  { label: "What we look for", items: r.lookingFor },
                ].map((col) => (
                  <div key={col.label} className="flex flex-col gap-4">
                    <Label>{col.label}</Label>
                    <ul className="m-0 flex list-none flex-col border-b border-line p-0">
                      {col.items.map((item) => (
                        <li key={item} className="border-t border-line py-3.5 text-ink-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </AutoGrid>
            </article>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <p className="m-0 max-w-[52ch] text-ink-2">
            Curious what the research work looks like? Our Wharf study ran thousands of attempts
            across models and agent harnesses.
          </p>
          <ArrowLink href={researchHref}>Read the research</ArrowLink>
        </div>
      </Container>

      <DarkBand>
        <Container className="py-26">
          <AutoGrid min={320} className="items-center gap-14">
            <div className="flex flex-col gap-4">
              <Eyebrow dark>How to reach us</Eyebrow>
              <H2 dark>No application portal. Just send us a note.</H2>
              <p className="m-0 text-night-muted">
                Tell us which role interests you, what you&apos;ve built, and a link to your work
                or CV. Don&apos;t see a role that fits? Write anyway. We read everything.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href={mailto("General")}
                className="inline-flex min-h-12 items-center self-start bg-accent px-[22px] font-medium text-white transition-colors hover:bg-paper hover:text-ink"
              >
                Email {careersEmail}
              </a>
            </div>
          </AutoGrid>
        </Container>
      </DarkBand>
    </>
  );
}
