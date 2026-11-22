import type { ReactNode } from "react";
import { Container, Eyebrow, H2 } from "@/components/ui";

/*
 * Building blocks for the Wharf research pages, which read as an argument: a claim in the hero,
 * a short numbered list of findings, then one section per finding with a single key number and a
 * single lead chart. Supporting detail sits behind a <More> disclosure so it's there for readers
 * who want it without crowding the ones who don't.
 */

export type FindingSummary = { id: string; title: string; body: string };

/** The hero's map of the page: each finding as one line, linking to its section. */
export function FindingsIndex({ findings, label = "What we found" }: { findings: FindingSummary[]; label?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 font-mono text-xs tracking-[0.08em] text-muted uppercase">{label}</p>
      <ol className="m-0 flex list-none flex-col border-b border-line p-0">
        {findings.map((f, i) => (
          <li key={f.id} className="border-t border-line">
            <a href={`#${f.id}`} className="group grid grid-cols-[40px_1fr] gap-3 py-4">
              <span className="font-mono text-[15px] text-accent-ink">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex flex-col gap-1">
                <span className="text-[17px] font-medium group-hover:text-accent-ink">{f.title}</span>
                <span className="text-[15px] text-ink-2">{f.body}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * One finding: number, claim, a short explanation and the key number beside it, then whatever
 * evidence follows as children.
 */
export function Finding({
  id,
  n,
  of,
  title,
  stat,
  statLabel,
  intro,
  tone = "paper",
  children,
}: {
  id: string;
  n: number;
  of: number;
  title: ReactNode;
  stat: string;
  statLabel: ReactNode;
  intro: ReactNode;
  tone?: "paper" | "surface";
  children: ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-12 border-t border-line ${tone === "surface" ? "bg-surface" : ""}`}>
      <Container className="flex flex-col gap-10 py-26">
        <div className="grid items-end gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex max-w-[64ch] flex-col gap-4">
            <Eyebrow>
              Finding {n} of {of}
            </Eyebrow>
            <H2>{title}</H2>
            <div className="flex flex-col gap-4 text-ink-2 [&_p]:m-0">{intro}</div>
          </div>
          <div className="flex flex-col gap-2 border-l-2 border-accent pl-6">
            <p className="m-0 font-display text-[clamp(44px,5vw,60px)] leading-none tracking-[-0.02em] text-ink">{stat}</p>
            <p className="m-0 text-[15px] text-ink-2">{statLabel}</p>
          </div>
        </div>
        {children}
      </Container>
    </section>
  );
}

/** A secondary point inside a finding: smaller heading, short text, its own evidence. */
export function Aside({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-t border-line pt-10">
      <h3 className="m-0 text-[21px] font-semibold">{title}</h3>
      {children}
    </div>
  );
}

/** Supporting detail, closed by default. */
export function More({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="group border border-line bg-paper">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 font-mono text-xs text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="inline-block transition-transform group-open:rotate-90">
          ›
        </span>
        {summary}
      </summary>
      <div className="flex flex-col gap-4 border-t border-line p-4">{children}</div>
    </details>
  );
}
