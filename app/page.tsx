/* Hallmark · macrostructure: Evidence-led (hero → proof band → index) · genre: editorial · tone: technical
 * theme: brand (Ivory paper · Copper accent · Newsreader display + Geist body/mono)
 * pre-emit critique: P4 H4 E4 S5 R4 V4
 */
import Link from "next/link";
import { ContactForm } from "@/components/Forms";
import { CostQualityChart } from "@/components/CostQualityChart";
import { researchHref } from "@/lib/site";
import { passRate, pct, run, runs, taskCount, totalPlanned, usd, wharfDate } from "@/content/wharf";
import {
  ArrowLink,
  AutoGrid,
  ButtonLink,
  Container,
  DarkBand,
  Eyebrow,
  H2,
} from "@/components/ui";

const opusCopilot = run("copilot-claude-opus-5-max-1.0.77");
const opusClaudeCode = run("cc-claude-opus-5-max-2.1.220");
const luna = run("copilot-gpt-5.6-luna-max-1.0.77");
const auto = run("copilot-auto-max-1.0.77");
const harnessGap = ((passRate(opusCopilot) - passRate(opusClaudeCode)) * 100).toFixed(1);

const practices = [
  {
    title: "AI-Native Engineering",
    body: "Rebuild your software lifecycle around agents: agent-ready codebases, spec-driven development, and review pipelines that keep humans in charge.",
    href: "/engineering",
  },
  {
    title: "Forward-Deployed Engineers",
    body: "Senior engineers who sit with your operators, find the workflows where AI moves a real metric, and build software around an agreed business outcome.",
    href: "/forward-deployed",
  },
  {
    title: "Model Testing & Evals",
    body: "Evaluation harnesses built on your data and your tasks, so model choice, prompt changes and upgrades are decisions backed by evidence.",
    href: "/model-testing",
  },
  {
    title: "AI-Native Playbook",
    body: "The practices, conventions and guardrails we use ourselves — taught to your team through workshops, pairing and codified standards.",
    href: "/playbook",
  },
];

const timeline = [
  { when: "Step 1 — Discover", title: "Map the work", body: "Engineers shadow the teams doing the work and inventory tasks by frequency, cost and risk." },
  { when: "Step 2 — Prototype", title: "Build the smallest real thing", body: "A working tool in the hands of real users, against real data — not a demo environment." },
  { when: "Step 3 — Prove", title: "Measure against a baseline", body: "Task-specific evals and business metrics agreed up front decide whether it ships." },
  { when: "Step 4 — Hand off", title: "Leave your team stronger", body: "Code, eval suites, runbooks and the habits to extend them — owned by your engineers." },
];

const principles = [
  { title: "Start from the work, not the model.", body: "We identify opportunities by working with the people who perform the tasks." },
  { title: "If it isn’t evaluated, it isn’t done.", body: "Every prompt, model and agent ships with tests that say when it breaks." },
  { title: "Treat project context as part of the codebase.", body: "Specs, conventions and docs are written for agents and humans alike." },
  { title: "Humans own the judgment.", body: "Agents write more of the code; engineers own design, review and accountability." },
];

export default function Home() {
  return (
    <>
      {/* Hero — one column, the claim first */}
      <Container className="pt-24 pb-20 sm:pt-32">
        <div className="flex flex-col gap-8">
          <Eyebrow>AI-native engineering consultancy</Eyebrow>
          <h1 className="m-0 max-w-[14ch] font-display text-[clamp(46px,8vw,104px)] leading-[0.98] font-normal tracking-[-0.025em] [overflow-wrap:anywhere]">
            We build AI systems your team can run.
          </h1>
          <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
            <p className="m-0 max-w-[44ch] text-xl text-ink-2">
              Our senior engineers work alongside your team to identify valuable workflows,
              build production software, and measure the results.
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
              <ButtonLink href="#contact">Request a discovery call</ButtonLink>
              <ArrowLink href="#practices">See how we work</ArrowLink>
            </div>
          </div>
        </div>
      </Container>

      {/* Evidence — the Wharf chart is the proof, so it sits directly under the claim */}
      <section aria-label="Wharf benchmark results" className="border-y border-line bg-surface">
        <Container className="grid gap-12 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-center lg:gap-16">
          <div className="flex flex-col gap-5 lg:order-2">
            <H2 className="text-[clamp(30px,3.2vw,40px)]">
              Same model, two harnesses, {harnessGap} points apart.
            </H2>
            <p className="m-0 text-ink-2">
              On Wharf, our coding-agent benchmark, Claude Opus 5 passed{" "}
              {pct(passRate(opusCopilot))} of attempts in GitHub Copilot and{" "}
              {pct(passRate(opusClaudeCode))} in Claude Code — at {usd(opusCopilot.costPerAttempt)}{" "}
              versus {usd(opusClaudeCode.costPerAttempt)} per attempt. You only see that by testing
              on real tasks.
            </p>
            <p className="m-0 font-mono text-xs text-muted">
              {totalPlanned.toLocaleString("en-US")} planned attempts · {runs.length} configurations
              · {taskCount} tasks · {wharfDate}
            </p>
            <div>
              <ArrowLink href={researchHref}>Read the Wharf research</ArrowLink>
            </div>
          </div>
          <figure className="m-0 flex min-w-0 flex-col gap-3 lg:order-1">
            <div className="overflow-x-auto">
              <CostQualityChart
                runs={runs}
                pair={[opusCopilot.id, opusClaudeCode.id]}
                labels={[
                  { id: luna.id, text: "GPT-5.6 Luna" },
                  { id: opusCopilot.id, text: "Opus 5 · Copilot", anchor: "end" },
                  { id: opusClaudeCode.id, text: "Opus 5 · Claude Code", anchor: "end" },
                  { id: auto.id, text: "Copilot Auto" },
                ]}
              />
            </div>
            <figcaption className="font-mono text-xs text-muted">
              Pass rate against mean cost per attempt. Up and to the left is better. Missing
              attempts count as failures.
            </figcaption>
          </figure>
        </Container>
      </section>

      {/* Practices — an index, not a card grid */}
      <Container className="pt-28 pb-24">
        <div
          id="practices"
          className="grid scroll-mt-8 gap-6 pb-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-end lg:gap-16"
        >
          <H2>Four disciplines. One standard: it works in production.</H2>
          <p className="m-0 max-w-[40ch] text-ink-2">
            Each practice stands alone, but most engagements move through all four — from finding
            the opportunity to keeping it honest after launch.
          </p>
        </div>
        <ul className="m-0 list-none border-b border-line p-0">
          {practices.map((p) => (
            <li key={p.href} className="border-t border-line">
              <Link
                href={p.href}
                className="group grid gap-3 py-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_auto] md:items-baseline md:gap-12"
              >
                <span className="font-display text-[clamp(26px,3vw,36px)] leading-[1.1] tracking-[-0.01em] text-ink transition-colors group-hover:text-accent-ink">
                  {p.title}
                </span>
                <span className="text-ink-2">{p.body}</span>
                <span
                  aria-hidden="true"
                  className="hidden text-xl text-accent-ink transition-transform group-hover:translate-x-1 motion-reduce:transition-none md:block"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      {/* Engagement timeline */}
      <DarkBand>
        <Container className="flex flex-col gap-14 py-24">
          <H2 dark className="max-w-[24ch]">
            From first conversation to production, with a gate at every step.
          </H2>
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

      {/* Principles — statements, set large */}
      <Container className="pt-32 pb-24">
        <H2 className="max-w-[22ch]">
          AI-native isn’t a tool rollout. It’s a different way of engineering.
        </H2>
        <ul className="m-0 mt-16 grid list-none gap-x-16 gap-y-12 p-0 md:grid-cols-2">
          {principles.map((p) => (
            <li key={p.title} className="flex flex-col gap-3 border-t border-ink pt-6">
              <h3 className="m-0 font-display text-[clamp(24px,2.4vw,30px)] leading-[1.15] font-normal tracking-[-0.01em]">
                {p.title}
              </h3>
              <p className="m-0 max-w-[44ch] text-ink-2">{p.body}</p>
            </li>
          ))}
        </ul>
      </Container>

      {/* Contact */}
      <section className="border-t border-line">
        <Container className="py-28">
          <AutoGrid min={320} className="gap-16">
            <div id="contact" className="flex scroll-mt-8 flex-col gap-5">
              <h2 className="m-0 font-display text-[clamp(38px,5vw,60px)] leading-[1.02] font-normal tracking-[-0.02em]">
                Find where AI can improve your business.
              </h2>
              <p className="m-0 max-w-[40ch] text-ink-2">
                Start with a discovery call to discuss your goals and constraints. Together, we
                decide whether a discovery sprint, codebase review, or evaluation program is the
                right next step. A discovery sprint produces a ranked opportunity map and a
                working prototype of the top candidate.
              </p>
            </div>
            <ContactForm />
          </AutoGrid>
        </Container>
      </section>
    </>
  );
}
