/* Hallmark · macrostructure: Offer-led (hero → offerings → examples → evidence → engagement → contact) · genre: editorial · tone: technical
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

const practiceLinks = [
  { label: "Forward-Deployed Engineers", href: "/forward-deployed" },
  { label: "AI-Native Engineering", href: "/engineering" },
  { label: "AI-Native Playbook", href: "/playbook" },
];

const offerings = [
  {
    n: "01",
    eyebrow: "Done for You",
    title: "We build it.",
    body: "Our engineers scope, build and ship the system in your environment. Afterward, we hand it over or keep running it as a managed service.",
    youGive: "A workflow owner, domain expertise and access to system owners.",
    youGet: "Production software, with our team responsible for delivery.",
    href: "/done-for-you",
  },
  {
    n: "02",
    eyebrow: "Hands-on Team Enablement",
    title: "Help your team achieve more.",
    body: "We teach our AI engineering practices through pairing, code review and hands-on work in your codebase, building on how your team uses AI today.",
    youGive: "Engineers with time to learn and apply the practices to real work.",
    youGet: "Practical experience, a better development workflow and a playbook your team can keep using.",
    href: "/build-with-your-team",
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

const commitments = [
  {
    n: "01",
    title: "Agree the goal.",
    body: "We agree the scope, time commitment and what success looks like before work starts.",
  },
  {
    n: "02",
    title: "Work in your environment.",
    body: "We work in your systems and codebase, with your people. The code, data and documentation stay yours.",
  },
  {
    n: "03",
    title: "Verify the result.",
    body: "We check the work against the agreed goals and leave you with evidence, documented decisions and clear next steps.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero — one column, the claim first */}
      <Container className="pt-24 pb-20 sm:pt-32">
        <div className="flex flex-col gap-8">
          <Eyebrow>AI-native engineering consultancy</Eyebrow>
          <h1 className="m-0 max-w-[20ch] font-display text-[clamp(46px,8vw,104px)] leading-[0.98] font-normal tracking-[-0.025em] [overflow-wrap:anywhere]">
            We build AI systems. We teach your engineers how to build better.
          </h1>
          <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
            <p className="m-0 max-w-[44ch] text-xl text-ink-2">
              We build AI systems for your business and teach your engineers how to get more
              from AI in their own work. Choose a delivery team or hands-on guidance for yours.
              The code, data and IP stay yours.
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
              <ButtonLink href="#contact">Request a discovery call</ButtonLink>
              <ArrowLink href="#offerings">Two ways to work with us</ArrowLink>
            </div>
          </div>
        </div>
      </Container>

      {/* Offerings — the first decision a buyer makes */}
      <section aria-labelledby="offerings-heading" className="border-y border-line bg-surface">
        <Container className="py-20 sm:py-24">
          <div id="offerings" className="flex scroll-mt-8 flex-col gap-4 pb-12">
            <Eyebrow>Two ways to work with us</Eyebrow>
            <h2 id="offerings-heading" className="m-0 max-w-[23ch] font-display text-[clamp(32px,3.8vw,48px)] leading-[1.08] tracking-[-0.015em]">
              A system delivered, or a stronger engineering team.
            </h2>
          </div>
          <div className="grid gap-px border border-line bg-line lg:grid-cols-2">
            {offerings.map((o) => (
              <Link key={o.href} href={o.href} className="group flex flex-col gap-6 border-t-2 border-accent bg-paper p-8 transition-colors hover:border-accent-ink sm:p-10">
                <div className="flex flex-col gap-3">
                  <Eyebrow>
                    {o.n} — {o.eyebrow}
                  </Eyebrow>
                  <h3 className="m-0 font-display text-[clamp(30px,3.4vw,44px)] leading-[1.05] font-normal tracking-[-0.015em] text-ink transition-colors group-hover:text-accent-ink">
                    {o.title}
                  </h3>
                  <p className="m-0 text-ink-2">{o.body}</p>
                </div>
                <dl className="m-0 mt-auto flex flex-col gap-4 border-t border-line pt-6">
                  <div className="flex flex-col gap-1">
                    <dt className="font-mono text-xs tracking-[0.06em] text-muted uppercase">You provide</dt>
                    <dd className="m-0 text-ink-2">{o.youGive}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="font-mono text-xs tracking-[0.06em] text-accent-ink uppercase">You get</dt>
                    <dd className="m-0 text-ink-2">{o.youGet}</dd>
                  </div>
                </dl>
                <span className="font-medium text-ink group-hover:text-accent-ink">
                  Explore {o.eyebrow}{" "}
                  <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transition-none">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <p className="m-0 mt-6 flex flex-wrap gap-x-6 gap-y-1 text-ink-2">
            <span>Inside the offerings:</span>
            {practiceLinks.map((p) => (
              <Link key={p.href} href={p.href} className="font-medium text-ink underline decoration-line underline-offset-4 hover:text-accent-ink hover:decoration-accent">
                {p.label}
              </Link>
            ))}
          </p>
        </Container>
      </section>

      <section aria-labelledby="workflows-heading" className="bg-ink text-night-text">
        <Container className="py-20 sm:py-24">
          <div className="grid gap-6 pb-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-end lg:gap-16">
            <div className="flex min-w-0 flex-col gap-4">
              <Eyebrow dark>The work we can help with</Eyebrow>
              <h2 id="workflows-heading" className="m-0 max-w-[23ch] font-display text-[clamp(32px,3.8vw,48px)] leading-[1.08] tracking-[-0.015em]">
                Where could AI improve the work?
              </h2>
            </div>
            <p className="m-0 max-w-[42ch] text-night-muted">
              Illustrative examples. We scope each engagement around your systems,
              constraints, and measures of success.
            </p>
          </div>
          <div className="border-b border-night-line">
            {workflows.map((workflow) => (
              <article key={workflow.area} className="grid gap-6 border-t border-night-line py-9 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
                <div className="flex min-w-0 flex-col gap-3">
                  <Eyebrow dark>{workflow.area}</Eyebrow>
                  <h3 className="m-0 max-w-[25ch] font-display text-[clamp(26px,3vw,36px)] leading-[1.12] tracking-[-0.01em]">
                    {workflow.title}
                  </h3>
                </div>
                <dl className="m-0 flex min-w-0 flex-col gap-5">
                  <div>
                    <dt className="sr-only">What we could build</dt>
                    <dd className="m-0 text-night-muted">{workflow.description}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="font-mono text-xs tracking-[0.06em] text-accent-soft uppercase">Measure success</dt>
                    <dd className="m-0 text-night-muted">{workflow.measure}</dd>
                  </div>
                </dl>
              </article>
            ))}
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
              shows why we evaluate the whole system before choosing a stack. We don&apos;t
              resell a model or a cloud, so the evidence picks it.
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
            <Eyebrow dark>How we work</Eyebrow>
            <H2 dark className="max-w-[24ch]">
              Three commitments, either way.
            </H2>
          </div>
          <ol className="m-0 list-none p-0">
            {commitments.map((commitment) => (
              <li key={commitment.n} className="grid gap-5 border-t border-night-line py-7 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
                <div className="flex min-w-0 items-baseline gap-4">
                  <span className="font-mono text-[13px] text-accent-soft">{commitment.n}</span>
                  <h3 className="m-0 font-display text-[clamp(26px,3vw,36px)] leading-[1.12] font-normal text-paper">
                    {commitment.title}
                  </h3>
                </div>
                <p className="m-0 text-night-muted">{commitment.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </DarkBand>

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
                  A recommendation on the right offering and a scoped first step if there is a fit.
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
