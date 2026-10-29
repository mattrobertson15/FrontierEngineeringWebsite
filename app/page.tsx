/* Hallmark · macrostructure: Workflow-led (hero → examples → evidence → engagement → index) · genre: editorial · tone: technical
 * theme: brand (Ivory paper · Copper accent · Newsreader display + Geist body/mono)
 * pre-emit critique: P4 H4 E4 S5 R4 V4
 */
import Link from "next/link";
import { ContactForm } from "@/components/Forms";
import { CostQualityChart } from "@/components/CostQualityChart";
import { researchHref } from "@/lib/site";
import { passRate, pct, run, runs, taskCount, totalPlanned, wharfDate } from "@/content/wharf";
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
    body: "Codebases, specs, and review workflows that help your engineers ship with agents.",
    href: "/engineering",
  },
  {
    title: "Forward-Deployed Engineers",
    body: "Embedded engineers who turn operational problems into software your team owns.",
    href: "/forward-deployed",
  },
  {
    title: "Model Testing & Evals",
    body: "Tests on your data and tasks to guide model selection and catch regressions.",
    href: "/model-testing",
  },
  {
    title: "AI-Native Playbook",
    body: "Our working practices for building with agents, taught through workshops and pairing.",
    href: "/playbook",
  },
];

const workflows = [
  {
    area: "Finance & operations",
    title: "Reconcile records. Review exceptions.",
    description: "A reconciliation workflow that matches records, surfaces exceptions, and keeps an audit trail for review.",
    measure: "Time per reconciliation, unresolved exceptions, and correction rate.",
  },
  {
    area: "Customer support",
    title: "Resolve support requests sooner.",
    description: "A triage assistant that retrieves relevant guidance, suggests a response, and routes uncertain cases to a person.",
    measure: "Time to resolution, routing accuracy, and response quality.",
  },
  {
    area: "Engineering",
    title: "Ship agent-written code with confidence.",
    description: "A delivery workflow with clear specs, bounded agent tasks, automated checks, and human review before merge.",
    measure: "Time to an accepted change, review effort, and regression rate.",
  },
];

const timeline = [
  {
    step: "01 / Discover",
    title: "Choose the opportunity.",
    body: "We map the workflow with your operators and system owners, test feasibility, and agree on success measures.",
    deliverable: "A ranked opportunity map and a prototype of the top candidate.",
  },
  {
    step: "02 / Build",
    title: "Build in your environment.",
    body: "We integrate with your systems. Your team reviews working increments and steers priorities at each checkpoint.",
    deliverable: "Working software, tests, and documented decisions.",
  },
  {
    step: "03 / Prove",
    title: "Verify before launch.",
    body: "We test quality, controls, and recovery. Your workflow owners review the evidence and approve production use.",
    deliverable: "Acceptance evidence, eval suites, and operating checks.",
  },
  {
    step: "04 / Hand over",
    title: "Make the next change yourselves.",
    body: "We pair with your engineers until they can troubleshoot, extend, and deploy a change themselves.",
    deliverable: "Code, runbooks, and a prioritized backlog owned by your team.",
  },
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
              <ArrowLink href="#how-we-work">See how we work</ArrowLink>
            </div>
          </div>
        </div>
      </Container>

      <section aria-labelledby="workflows-heading" className="border-t border-line">
        <Container className="py-20 sm:py-24">
          <div className="grid gap-6 pb-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-end lg:gap-16">
            <div className="flex min-w-0 flex-col gap-4">
              <Eyebrow>The work we can help with</Eyebrow>
              <h2 id="workflows-heading" className="m-0 max-w-[23ch] font-display text-[clamp(32px,3.8vw,48px)] leading-[1.08] tracking-[-0.015em]">
                Where could AI improve the work?
              </h2>
            </div>
            <p className="m-0 max-w-[42ch] text-ink-2">
              Illustrative examples. We scope each engagement around your systems,
              constraints, and measures of success.
            </p>
          </div>
          <div className="border-b border-line">
            {workflows.map((workflow) => (
              <article key={workflow.area} className="grid gap-6 border-t border-line py-9 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
                <div className="flex min-w-0 flex-col gap-3">
                  <Eyebrow>{workflow.area}</Eyebrow>
                  <h3 className="m-0 max-w-[25ch] font-display text-[clamp(26px,3vw,36px)] leading-[1.12] tracking-[-0.01em]">
                    {workflow.title}
                  </h3>
                </div>
                <dl className="m-0 flex min-w-0 flex-col gap-5">
                  <div>
                    <dt className="sr-only">What we could build</dt>
                    <dd className="m-0 text-ink-2">{workflow.description}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="font-mono text-xs tracking-[0.06em] text-accent-ink uppercase">Measure success</dt>
                    <dd className="m-0 text-ink-2">{workflow.measure}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="mt-6">
            <ArrowLink href="/forward-deployed">Explore embedded delivery</ArrowLink>
          </div>
        </Container>
      </section>

      {/* Evidence — connect the benchmark to a buyer decision before showing the detail. */}
      <section aria-label="Wharf benchmark results" className="border-y border-line bg-surface">
        <Container className="grid gap-12 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-center lg:gap-16">
          <div className="flex flex-col gap-5 lg:order-2">
            <Eyebrow>How we make technical decisions</Eyebrow>
            <H2 className="text-[clamp(30px,3.2vw,40px)]">
              Test the stack on the task.
            </H2>
            <p className="m-0 text-ink-2">
              The tools around a model change its quality and cost. Our Wharf benchmark
              shows why we evaluate the whole system before choosing a stack.
            </p>
            <h3 className="m-0 text-xl font-semibold">
              Same model, two harnesses, {harnessGap} points apart.
            </h3>
            <p className="m-0 text-ink-2">
              Claude Opus 5 passed {pct(passRate(opusCopilot))} of attempts in GitHub Copilot
              and {pct(passRate(opusClaudeCode))} in Claude Code on the same benchmark.
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

      <DarkBand>
        <Container className="py-20 sm:py-24">
          <div id="how-we-work" className="flex scroll-mt-8 flex-col gap-5 pb-12">
            <Eyebrow dark>How an engagement works</Eyebrow>
            <H2 dark className="max-w-[24ch]">
              Build together. Take it forward.
            </H2>
            <p className="m-0 max-w-[60ch] text-night-muted">
              We agree on the outcome and handover criteria up front.
              Your team steers the work and owns the result.
            </p>
          </div>
          <ol className="m-0 list-none p-0">
            {timeline.map((stage) => (
              <li key={stage.step} className="grid gap-7 border-t border-night-line py-9 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
                <div className="flex min-w-0 flex-col gap-3">
                  <span className="font-mono text-[13px] text-accent-soft uppercase">{stage.step}</span>
                  <h3 className="m-0 max-w-[24ch] font-display text-[clamp(26px,3vw,36px)] leading-[1.12] font-normal text-paper">
                    {stage.title}
                  </h3>
                </div>
                <div className="flex min-w-0 flex-col gap-4">
                  <p className="m-0 text-night-muted">{stage.body}</p>
                  <dl className="m-0 border-l-2 border-accent-soft pl-4">
                    <dt className="font-mono text-xs text-accent-soft uppercase">You leave this stage with</dt>
                    <dd className="m-0 mt-2 text-paper">{stage.deliverable}</dd>
                  </dl>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </DarkBand>

      {/* Practices — an index, not a card grid */}
      <Container className="pt-28 pb-24">
        <div
          id="practices"
          className="grid scroll-mt-8 gap-6 pb-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-end lg:gap-16"
        >
          <H2>Explore our practices.</H2>
          <p className="m-0 max-w-[40ch] text-ink-2">
            Start with the support you need: delivery, engineering workflows,
            evaluations, or team enablement.
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

      {/* Contact */}
      <section className="border-t border-line">
        <Container className="py-28">
          <AutoGrid min={320} className="gap-16">
            <div id="contact" className="flex scroll-mt-8 flex-col gap-5">
              <h2 className="m-0 font-display text-[clamp(38px,5vw,60px)] leading-[1.02] font-normal tracking-[-0.02em]">
                What would you like to improve?
              </h2>
              <p className="m-0 max-w-[40ch] text-ink-2">
                Talk with our engineers about the workflow, what you have tried, and what
                a useful result would look like. Bring a workflow owner or technical lead.
              </p>
              <div className="flex flex-col gap-2 border-t border-line pt-5">
                <Eyebrow>What comes out of the call</Eyebrow>
                <p className="m-0 max-w-[40ch] text-ink-2">
                  A clear next step: a discovery sprint, codebase review, or evaluation
                  program, if there is a fit.
                </p>
              </div>
            </div>
            <ContactForm />
          </AutoGrid>
        </Container>
      </section>
    </>
  );
}
