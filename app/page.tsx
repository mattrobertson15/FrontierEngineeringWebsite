import { ContactForm } from "@/components/Forms";
import {
  ArrowLink,
  AutoGrid,
  ButtonLink,
  Container,
  DarkBand,
  Eyebrow,
  H2,
} from "@/components/ui";

const loop = [
  { n: "01", step: "embed", note: "FDEs on site, inside the workflow" },
  { n: "02", step: "discover", note: "map tasks → rank by value" },
  { n: "03", step: "build", note: "agent-ready repo, spec → code" },
  { n: "04", step: "prove", note: "evals gate every release", highlight: true },
];

const practiceCards = [
  {
    n: "01",
    title: "AI-Native Engineering",
    body: "Rebuild your software lifecycle around agents: agent-ready codebases, spec-driven development, and review pipelines that keep humans in charge.",
    href: "/engineering",
    cta: "Explore the practice",
  },
  {
    n: "02",
    title: "Forward-Deployed Engineers",
    body: "Senior engineers who sit with your operators, find the workflows where AI moves a real metric, and ship working software in weeks — not decks.",
    href: "/forward-deployed",
    cta: "Explore the practice",
  },
  {
    n: "03",
    title: "Model Testing & Evals",
    body: "Evaluation harnesses built on your data and your tasks, so model choice, prompt changes and upgrades are decisions backed by evidence.",
    href: "/model-testing",
    cta: "Explore the practice",
  },
  {
    n: "04",
    title: "AI-Native Playbook",
    body: "The practices, conventions and guardrails we use ourselves — taught to your team through workshops, pairing and codified standards.",
    href: "/playbook",
    cta: "Read the playbook",
  },
];

const timeline = [
  { when: "Step 1 — Discover", title: "Map the work", body: "Engineers shadow the teams doing the work and inventory tasks by frequency, cost and risk." },
  { when: "Step 2 — Prototype", title: "Build the smallest real thing", body: "A working tool in the hands of real users, against real data — not a demo environment." },
  { when: "Step 3 — Prove", title: "Measure against a baseline", body: "Task-specific evals and business metrics agreed up front decide whether it ships." },
  { when: "Step 4 — Hand off", title: "Leave your team stronger", body: "Code, eval suites, runbooks and the habits to extend them — owned by your engineers." },
];

const principles = [
  { id: "P.01", title: "Start from the work, not the model.", body: "The best opportunities are found on the floor, not in a strategy offsite." },
  { id: "P.02", title: "If it isn't evaluated, it isn't done.", body: "Every prompt, model and agent ships with tests that say when it breaks." },
  { id: "P.03", title: "Context is the codebase now.", body: "Specs, conventions and docs are written for agents and humans alike." },
  { id: "P.04", title: "Humans own the judgment.", body: "Agents write more of the code; engineers own design, review and accountability." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <Container className="pt-24 pb-20">
        <AutoGrid min={340} className="items-center gap-16">
          <div className="flex flex-col gap-7">
            <Eyebrow>AI-native engineering consultancy</Eyebrow>
            <h1 className="m-0 text-[clamp(42px,6vw,72px)] leading-[1.02] font-semibold tracking-[-0.035em]">
              Engineering built for the AI era. Proven in production.
            </h1>
            <p className="m-0 max-w-[34ch] text-xl text-ink-2">
              Frontier Engineering embeds senior engineers inside your business to find where AI actually pays,
              build it the AI-native way, and test it until the numbers hold.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="#contact">Start a discovery sprint</ButtonLink>
              <ButtonLink href="#practices" variant="outline">
                See how we work
              </ButtonLink>
            </div>
          </div>

          <div
            aria-label="Engagement loop: embed, discover, build, prove, then ship and hand off"
            role="img"
            className="flex flex-col gap-3.5 bg-ink p-7 font-mono text-[13px] text-night-text"
          >
            <div className="flex justify-between text-night-dim">
              <span>engagement.loop</span>
              <span>v1</span>
            </div>
            {loop.map((l, i) => (
              <div key={l.n} className="flex flex-col gap-3.5">
                {i > 0 && <div className="pl-[22px] text-slate">│</div>}
                <div
                  className={`flex items-center justify-between gap-3 border p-4 ${l.highlight ? "border-accent-soft" : "border-night-line"}`}
                >
                  <span>
                    <span className="text-accent-soft">{l.n}</span>&nbsp;&nbsp;{l.step}
                  </span>
                  <span className="text-right text-night-dim">{l.note}</span>
                </div>
              </div>
            ))}
            <div className="pl-[22px] text-slate">└─ ship · hand off · repeat</div>
          </div>
        </AutoGrid>
      </Container>

      {/* Practices */}
      <Container className="flex flex-col gap-14 pt-28 pb-24">
        <div id="practices" className="flex scroll-mt-8 flex-wrap items-end justify-between gap-6">
          <div className="flex max-w-[640px] flex-col gap-4">
            <Eyebrow>Practices</Eyebrow>
            <H2 className="text-[clamp(32px,4vw,48px)]">
              Four disciplines. One standard: it works in production.
            </H2>
          </div>
          <p className="m-0 max-w-[40ch] text-ink-2">
            Each practice stands alone, but most engagements move through all four — from finding
            the opportunity to keeping it honest after launch.
          </p>
        </div>
        {/* Fixed 1 → 2 → 4 columns so four cards never leave an orphan row. */}
        <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
          {practiceCards.map((c) => (
            <article
              key={c.n}
              className="flex min-w-0 flex-col gap-4 bg-surface p-6 break-words sm:p-8 xl:min-h-[340px]"
            >
              <span className="font-mono text-[13px] text-muted">{c.n}</span>
              <h3 className="m-0 text-[clamp(21px,2vw,24px)] font-semibold tracking-[-0.02em]">
                {c.title}
              </h3>
              <p className="m-0 flex-1 text-ink-2">{c.body}</p>
              <ArrowLink href={c.href}>{c.cta}</ArrowLink>
            </article>
          ))}
        </div>
      </Container>

      {/* Engagement timeline */}
      <DarkBand>
        <Container className="flex flex-col gap-14 py-28">
          <div className="flex max-w-[720px] flex-col gap-4">
            <Eyebrow dark>How an engagement runs</Eyebrow>
            <H2 dark className="text-[clamp(32px,4vw,48px)]">
              From first conversation to production, with a gate at every step.
            </H2>
          </div>
          <AutoGrid min={220} as="ol" className="m-0 list-none gap-8 p-0">
            {timeline.map((t, i) => (
              <li
                key={t.title}
                className={`flex flex-col gap-3 border-t pt-5 ${i === 0 ? "border-accent-soft" : "border-night-line"}`}
              >
                <span className="font-mono text-[13px] text-accent-soft uppercase">{t.when}</span>
                <h3 className="m-0 text-[21px] font-semibold text-paper">{t.title}</h3>
                <p className="m-0 text-night-muted">{t.body}</p>
              </li>
            ))}
          </AutoGrid>
        </Container>
      </DarkBand>

      {/* Principles */}
      <Container className="py-28">
        <AutoGrid min={320} className="gap-16">
          <div className="flex flex-col gap-4">
            <Eyebrow>What we believe</Eyebrow>
            <H2 className="text-[clamp(32px,4vw,48px)]">
              AI-native isn&apos;t a tool rollout. It&apos;s a different way of engineering.
            </H2>
          </div>
          <ul className="m-0 flex list-none flex-col border-b border-line p-0">
            {principles.map((p) => (
              <li key={p.id} className="grid grid-cols-[56px_1fr] gap-4 border-t border-line py-[22px]">
                <span className="pt-1 font-mono text-[13px] text-muted">{p.id}</span>
                <div>
                  <h3 className="m-0 mb-1.5 text-[19px] font-semibold">{p.title}</h3>
                  <p className="m-0 text-ink-2">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </AutoGrid>
      </Container>

      {/* Contact */}
      <Container className="py-28">
        <AutoGrid min={320} className="gap-16">
          <div id="contact" className="flex scroll-mt-8 flex-col gap-5">
            <h2 className="m-0 text-[clamp(36px,5vw,56px)] leading-[1.04] font-semibold tracking-[-0.035em]">
              Find out where AI pays in your business.
            </h2>
            <p className="m-0 max-w-[40ch] text-ink-2">
              Start with a fixed-scope discovery sprint. You leave with a ranked opportunity map and
              a working prototype of the top candidate.
            </p>
          </div>
          <ContactForm />
        </AutoGrid>
      </Container>
    </>
  );
}
