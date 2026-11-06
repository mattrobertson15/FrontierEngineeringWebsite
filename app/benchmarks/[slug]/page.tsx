import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { benchmarksHref, contactHref } from "@/lib/site";
import {
  assessmentAxes,
  benchmark,
  benchmarks,
  benchmarksLaunched,
  categories,
  compact,
  formatMonth,
  labs,
  labsReporting,
  statuses,
  type AssessmentAxis,
} from "@/content/benchmarks";
import { Expandable, LabDots, RatingMeter, Tag } from "@/components/benchmarks";
import { ArrowLink, Container, CtaStrip, HairlineGrid, PageHero, StatGrid } from "@/components/ui";

export function generateStaticParams() {
  return benchmarks.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/benchmarks/[slug]">): Promise<Metadata> {
  const b = benchmark((await params).slug);
  if (!b) return {};
  return {
    title: `${b.name} — Benchmark Directory`,
    description: b.summary,
    robots: benchmarksLaunched ? undefined : { index: false, follow: false },
  };
}

const sections = [
  { id: "overview", label: "Overview" },
  { id: "methodology", label: "Methodology" },
  { id: "adoption", label: "Lab adoption" },
  { id: "assessment", label: "Our assessment" },
  { id: "limitations", label: "Limitations" },
  { id: "sources", label: "Sources" },
] as const;

export default async function BenchmarkPage({ params }: PageProps<"/benchmarks/[slug]">) {
  const b = benchmark((await params).slug);
  if (!b) notFound();

  const reporting = labsReporting(b);
  const related = b.related.map((s) => benchmark(s)).filter((r) => r !== undefined);
  const stars = compact(b.signals.githubStars);
  const cites = compact(b.signals.paperCitations);

  return (
    <>
      <PageHero
        eyebrow={`Benchmark directory — ${categories[b.category]}`}
        title={b.name}
        lede={b.summary}
      />

      <Container className="pb-16">
        <StatGrid
          items={[
            { label: "GITHUB STARS", value: stars ?? "Pending", small: !stars },
            {
              label: b.signals.citationSource ? `CITATIONS · ${b.signals.citationSource.toUpperCase()}` : "PAPER CITATIONS",
              value: cites ?? "Pending",
              small: !cites,
            },
            { label: "LABS REPORTING", value: `${reporting.length} of ${labs.length}` },
            { label: "RELEASED", value: formatMonth(b.released) },
            { label: "STATUS", value: statuses[b.status], small: true },
          ]}
        />
      </Container>

      <Container className="pb-26">
        <div className="grid gap-12 lg:grid-cols-[200px_minmax(0,1fr)]">
          <nav aria-label="On this page" className="lg:sticky lg:top-8 lg:self-start">
            <p className="m-0 mb-3 font-mono text-xs tracking-[0.08em] text-muted uppercase">On this page</p>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0 lg:flex-col lg:gap-0 lg:border-l lg:border-line">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="inline-flex min-h-10 items-center border border-line px-3 text-[15px] text-ink-2 hover:text-accent-ink lg:min-h-9 lg:border-0 lg:px-4"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex min-w-0 flex-col gap-20">
            <Section id="overview" n={1} title="Overview">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <SubLabel>What it measures</SubLabel>
                  <p className="m-0 text-[18px] text-ink-2">{b.measures}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <SubLabel>Why it&apos;s different</SubLabel>
                  <p className="m-0 text-[18px] text-ink-2">{b.positioning}</p>
                </div>
              </div>
              <p className="m-0 font-mono text-[13px] text-muted">
                Maintained by {b.maintainer}
                {b.fullName && <> · {b.fullName}</>}
              </p>
            </Section>

            <Section id="methodology" n={2} title="Methodology">
              <dl className="m-0 border-b border-line">
                {(
                  [
                    ["Task format", b.methodology.format],
                    ["Size", b.methodology.size],
                    ["Scoring", b.methodology.scoring],
                    ["Environment", b.methodology.environment],
                    ["Contamination controls", b.methodology.contaminationControls],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="grid gap-1 border-t border-line py-4 sm:grid-cols-[200px_1fr] sm:gap-6">
                    <dt className="font-mono text-xs tracking-[0.08em] text-muted uppercase sm:pt-1">{k}</dt>
                    <dd className="m-0 text-ink-2">{v}</dd>
                  </div>
                ))}
              </dl>
              {b.methodology.deepDive.length > 0 && (
                <div>
                  <SubLabel>Go deeper</SubLabel>
                  <div className="mt-2">
                    {b.methodology.deepDive.map((d) => (
                      <Expandable key={d.title} title={d.title}>
                        <p className="m-0">{d.body}</p>
                      </Expandable>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section id="adoption" n={3} title="Lab adoption">
              <div className="flex flex-wrap items-center gap-4">
                <LabDots reporting={reporting} size="md" />
                <span className="text-ink-2">
                  {reporting.length} of {labs.length} tracked frontier labs have reported a result.
                </span>
              </div>
              <ul className="m-0 grid list-none grid-cols-2 gap-px border border-line bg-line p-0 sm:grid-cols-4">
                {labs.map((lab) => {
                  const n = b.labReports.filter((r) => r.lab === lab).length;
                  return (
                    <li key={lab} className="flex flex-col gap-1 bg-surface p-4">
                      <span className="text-[15px] font-medium">{lab}</span>
                      <span className={`font-mono text-[12px] ${n ? "text-accent-ink" : "text-muted"}`}>
                        {n ? `${n} report${n > 1 ? "s" : ""}` : "None found"}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {b.labReports.length === 0 ? (
                <p className="m-0 border-l-2 border-accent pl-4 font-mono text-[13px] text-muted">
                  Lab citation data is being collected for this benchmark.
                </p>
              ) : (
                <Expandable title="Every reported result" meta={`${b.labReports.length} entries`}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] border-collapse text-[15px]">
                      <thead>
                        <tr className="border-b border-ink text-left">
                          {["Lab", "Model", "Score", "Source", "Date"].map((h) => (
                            <th key={h} scope="col" className="py-2 pr-4 font-mono text-xs font-normal text-muted uppercase">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...b.labReports]
                          .sort((x, y) => y.date.localeCompare(x.date))
                          .map((r, i) => (
                            <tr key={i} className="border-b border-line">
                              <td className="py-2.5 pr-4 font-medium text-ink">{r.lab}</td>
                              <td className="py-2.5 pr-4">{r.model ?? "—"}</td>
                              <td className="py-2.5 pr-4 font-mono">{r.score ?? "—"}</td>
                              <td className="py-2.5 pr-4">
                                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-accent-ink">
                                  {r.source} ↗
                                </a>
                              </td>
                              <td className="py-2.5 font-mono text-[13px]">{formatMonth(r.date)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </Expandable>
              )}
            </Section>

            <Section id="assessment" n={4} title="Our assessment">
              <p className="m-0 max-w-[62ch] text-ink-2">
                Our editorial read, kept separate from the measured signals above.
              </p>
              <dl className="m-0 border-b border-line">
                {(Object.keys(assessmentAxes) as AssessmentAxis[]).map((axis) => (
                  <div key={axis} className="grid gap-2 border-t border-line py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
                    <dt className="flex flex-col gap-1">
                      <span className="font-medium">{assessmentAxes[axis].label}</span>
                      <span className="text-[15px] text-ink-2">{assessmentAxes[axis].help}</span>
                    </dt>
                    <dd className="m-0">
                      <RatingMeter rating={b.assessment[axis]} />
                    </dd>
                  </div>
                ))}
              </dl>
            </Section>

            <Section id="limitations" n={5} title="Limitations & critiques">
              <div>
                {b.limitations.map((l) => (
                  <Expandable key={l.title} title={l.title}>
                    <p className="m-0">{l.body}</p>
                  </Expandable>
                ))}
              </div>
            </Section>

            <Section id="sources" n={6} title="Sources">
              <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
                {Object.entries(b.links).map(([kind, url]) => (
                  <li key={kind}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 border border-ink px-4 text-[15px] font-medium text-ink capitalize hover:bg-ink hover:text-paper"
                    >
                      {kind} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-line bg-surface">
          <Container className="flex flex-col gap-8 py-20">
            <SubLabel>Related benchmarks</SubLabel>
            <HairlineGrid min={280} as="ul">
              {related.map((r) => (
                <li key={r.slug} className="flex">
                  <Link href={`${benchmarksHref}/${r.slug}`} className="group flex flex-1 flex-col gap-3 bg-paper p-7 hover:bg-surface">
                    <span className="flex flex-wrap gap-2">
                      <Tag>{categories[r.category]}</Tag>
                    </span>
                    <span className="text-[20px] font-semibold group-hover:text-accent-ink">{r.name}</span>
                    <span className="flex-1 text-[15px] text-ink-2">{r.summary}</span>
                    <LabDots reporting={labsReporting(r)} />
                  </Link>
                </li>
              ))}
            </HairlineGrid>
          </Container>
        </section>
      )}

      <Container className="py-10">
        <ArrowLink href={benchmarksHref}>All benchmarks</ArrowLink>
      </Container>

      <CtaStrip title="Benchmarks rank models. Your workload picks one." href={contactHref} label="Request a discovery call" />
    </>
  );
}

function Section({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="flex scroll-mt-8 flex-col gap-6">
      <div className="flex items-baseline gap-4 border-t border-ink pt-5">
        <span className="font-mono text-sm text-accent-ink">{String(n).padStart(2, "0")}</span>
        <h2 id={`${id}-h`} className="m-0 text-[28px] font-semibold tracking-[-0.02em]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function SubLabel({ children }: { children: ReactNode }) {
  return <p className="m-0 font-mono text-xs tracking-[0.08em] text-muted uppercase">{children}</p>;
}
