import type { Metadata } from "next";
import { PlaybookSignup } from "@/components/Forms";
import { adoptionOptions, playbookRules } from "@/content/playbook";
import {
  AutoGrid,
  Container,
  DarkBand,
  Eyebrow,
  H2,
  HairlineGrid,
  PageHero,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "The AI-Native Playbook",
  description:
    "The working rules Frontier Engineering engineers follow when building software with agents — and how to bring them to your team.",
};

export default function PlaybookPage() {
  return (
    <>
      <PageHero
        eyebrow="Practice 04 — The AI-native playbook"
        title="How we write software with agents. Now yours."
        lede="These are the working rules our engineers follow on every engagement. We publish them because they're more useful in use than in a drawer — and we teach them hands-on to teams who want to adopt them."
      />

      <Container className="pt-6 pb-26">
        <ol className="m-0 flex list-none flex-col border-b border-line p-0">
          {playbookRules.map((rule, i) => (
            <li
              key={rule.title}
              className={`border-t py-8 ${i === 0 ? "border-ink" : "border-line"}`}
            >
              <AutoGrid min={280} className="gap-x-12 gap-y-3">
                <div className="flex items-baseline gap-5">
                  <span className="font-mono text-sm text-accent-ink">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="m-0 text-[26px] font-semibold tracking-[-0.02em]">{rule.title}</h2>
                </div>
                <p className="m-0 text-ink-2">{rule.body}</p>
              </AutoGrid>
            </li>
          ))}
        </ol>
      </Container>

      <DarkBand>
        <Container className="py-26">
          <AutoGrid min={320} className="items-start gap-14">
            <div className="flex flex-col gap-4">
              <Eyebrow dark>In the repo</Eyebrow>
              <H2 dark>Rules only work when agents can read them.</H2>
              <p className="m-0 text-night-muted">
                We codify the playbook into the files your agents load on every task — so the
                standard is applied by default, not by memory.
              </p>
            </div>
            <pre className="m-0 overflow-x-auto border border-night-line p-6 font-mono text-[13px] leading-[1.7] whitespace-pre text-night-text">
              <span className="text-night-dim"># AGENTS.md — excerpt</span>
              {"\n\n"}
              <span className="text-accent-soft">## Before you code</span>
              {"\n- Read the spec in /specs for this task\n- Run `make test` and confirm it passes\n\n"}
              <span className="text-accent-soft">## While you code</span>
              {"\n- Keep diffs under [N] lines; split otherwise\n- Follow patterns in /docs/architecture.md\n- Never edit /migrations without approval\n\n"}
              <span className="text-accent-soft">## Before you finish</span>
              {"\n- Add or update tests for every change\n- Run `make evals` if prompts changed\n- Summarize what changed and why"}
            </pre>
          </AutoGrid>
        </Container>
      </DarkBand>

      <Container className="flex flex-col gap-12 py-26">
        <div className="flex max-w-[680px] flex-col gap-3.5">
          <Eyebrow>Adopt the playbook</Eyebrow>
          <H2>Three ways to bring it to your team</H2>
        </div>
        <HairlineGrid min={280}>
          {adoptionOptions.map((o) => (
            <article key={o.title} className="flex flex-col gap-3.5 bg-surface p-8">
              <span className="font-mono text-xs text-muted">{o.duration}</span>
              <h3 className="m-0 text-[22px] font-semibold">{o.title}</h3>
              <p className="m-0 flex-1 text-ink-2">{o.body}</p>
              <p className="m-0 font-semibold">{o.price}</p>
            </article>
          ))}
        </HairlineGrid>
      </Container>

      <section className="border-t border-line">
        <Container className="flex flex-wrap items-center justify-between gap-6 py-20">
          <h2 className="m-0 max-w-[22ch] text-[clamp(28px,3.4vw,40px)] leading-[1.1] font-semibold tracking-[-0.03em]">
            Get the full playbook in your inbox.
          </h2>
          <PlaybookSignup />
        </Container>
      </section>
    </>
  );
}
