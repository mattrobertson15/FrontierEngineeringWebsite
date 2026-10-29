/* Hallmark · macrostructure: Workflow-led (hero → examples → evidence → engagement → index) · genre: editorial · tone: technical
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

const workflows = [
  {
    area: "Finance & operations",
    title: "Make exceptions the work, not reconciliation.",
    problem: "Teams compare records across systems by hand and chase mismatches in spreadsheets.",
    system: "A reconciliation workflow that matches records, surfaces exceptions, and keeps an audit trail for review.",
    measure: "Time per reconciliation, unresolved exceptions, and correction rate.",
  },
  {
    area: "Customer support",
    title: "Give every request a useful starting point.",
    problem: "Agents search scattered documentation and repeat the same intake and routing decisions.",
    system: "A triage assistant that retrieves relevant guidance, suggests a response, and routes uncertain cases to a person.",
    measure: "Time to resolution, routing accuracy, and response quality.",
  },
  {
    area: "Engineering",
    title: "Turn agent output into changes you can trust.",
    problem: "Coding agents produce changes faster than a team can confidently review and release them.",
    system: "A delivery workflow with clear specs, bounded agent tasks, automated checks, and human review before merge.",
    measure: "Time to an accepted change, review effort, and regression rate.",
  },
];

const timeline = [
  {
    step: "01 / Discover",
    title: "Choose the work worth changing.",
    ours: "Shadow operators, map the workflow, and test the most promising opportunities.",
    yours: "Bring the people who know the work, the system owners, and the constraints we need to respect.",
    deliverable: "A ranked opportunity map, a prototype of the top candidate, and an agreed measure of success.",
  },
  {
    step: "02 / Build",
    title: "Put working software in real hands.",
    ours: "Build in your environment and review working increments against real data and user feedback.",
    yours: "Give feedback at checkpoints, resolve domain questions, and steer priorities with us.",
    deliverable: "An integrated system with a reviewable record of decisions, tests, and known limits.",
  },
  {
    step: "03 / Prove",
    title: "Decide what is ready to ship.",
    ours: "Evaluate quality against the baseline and verify monitoring, controls, and recovery paths.",
    yours: "Review the evidence with the people accountable for the workflow and approve production use.",
    deliverable: "Acceptance evidence, task-specific evals, and operating checks tied to the agreed outcome.",
  },
  {
    step: "04 / Hand over",
    title: "Make the next change yourselves.",
    ours: "Pair with your engineers, document the system, and rehearse how to troubleshoot and extend it.",
    yours: "Name an owner and make a change with us beside you before taking the system forward.",
    deliverable: "Code, eval suites, runbooks, and a prioritized backlog in your team's hands.",
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
                Start with a workflow that needs to work better.
              </h2>
            </div>
            <p className="m-0 max-w-[42ch] text-ink-2">
              Illustrative engagement examples. We define the scope and success measures with
              your team, based on your systems and the work you actually do.
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
                  {[
                    ["The problem", workflow.problem],
                    ["What we could build", workflow.system],
                    ["What we would measure", workflow.measure],
                  ].map(([label, body]) => (
                    <div key={label} className="flex flex-col gap-1">
                      <dt className="font-mono text-xs tracking-[0.06em] text-accent-ink uppercase">{label}</dt>
                      <dd className="m-0 text-ink-2">{body}</dd>
                    </div>
                  ))}
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
              Choose your AI stack using evidence from the work.
            </H2>
            <p className="m-0 text-ink-2">
              Model choice is only part of the decision. The tools around it can change both
              quality and cost. We build evaluations around your tasks so you can see the tradeoffs
              before committing.
            </p>
            <h3 className="m-0 text-xl font-semibold">
              Same model, two harnesses, {harnessGap} points apart.
            </h3>
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

      <DarkBand>
        <Container className="py-20 sm:py-24">
          <div id="how-we-work" className="flex scroll-mt-8 flex-col gap-5 pb-12">
            <Eyebrow dark>How an engagement works</Eyebrow>
            <H2 dark className="max-w-[24ch]">
              A working system. A clear role for your team at every step.
            </H2>
            <p className="m-0 max-w-[60ch] text-night-muted">
              We agree on the outcome and the handover criteria before building. Your team
              shapes the work throughout, and owns the system that comes out of it.
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
                <dl className="m-0 grid min-w-0 gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="flex flex-col gap-2">
                    <dt className="font-mono text-xs text-accent-soft uppercase">Our role</dt>
                    <dd className="m-0 text-night-muted">{stage.ours}</dd>
                  </div>
                  <div className="flex flex-col gap-2">
                    <dt className="font-mono text-xs text-accent-soft uppercase">Your role</dt>
                    <dd className="m-0 text-night-muted">{stage.yours}</dd>
                  </div>
                  <div className="flex flex-col gap-2 border-l-2 border-accent-soft pl-4 sm:col-span-2">
                    <dt className="font-mono text-xs text-accent-soft uppercase">What you receive</dt>
                    <dd className="m-0 text-paper">{stage.deliverable}</dd>
                  </div>
                </dl>
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

      {/* Contact */}
      <section className="border-t border-line">
        <Container className="py-28">
          <AutoGrid min={320} className="gap-16">
            <div id="contact" className="flex scroll-mt-8 flex-col gap-5">
              <h2 className="m-0 font-display text-[clamp(38px,5vw,60px)] leading-[1.02] font-normal tracking-[-0.02em]">
                Bring a workflow. We’ll work out the next step.
              </h2>
              <p className="m-0 max-w-[40ch] text-ink-2">
                Start with a discovery call with our engineers. Tell us where the work slows
                down, what you have tried, and what a useful result would look like. Bring a
                workflow owner or technical lead if they can help explain the constraints.
              </p>
              <div className="flex flex-col gap-2 border-t border-line pt-5">
                <Eyebrow>What comes out of the call</Eyebrow>
                <p className="m-0 max-w-[40ch] text-ink-2">
                  A shared view of the problem and whether a discovery sprint, codebase review,
                  or evaluation program is the right next step.
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
