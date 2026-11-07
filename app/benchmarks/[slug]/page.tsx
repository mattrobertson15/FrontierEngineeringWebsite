import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { benchmarksHref, contactHref } from "@/lib/site";
import { getProfile, getPublishedSlugs } from "@/lib/benchmarks/data";
import {
  factLabel,
  formatDate,
  kindLabels,
  maintenanceLabels,
  tracks,
  verificationLabels,
  type Fact,
  type Profile,
  type Source,
} from "@/lib/benchmarks/types";
import { Expandable, Pending, Tag } from "@/components/benchmarks";
import { ArrowLink, Container, CtaStrip, PageHero, StatGrid } from "@/components/ui";

/** Cache Components needs at least one param at build time, even before anything is published. */
const NOTHING_PUBLISHED = "_none";

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return (slugs.length ? slugs : [NOTHING_PUBLISHED]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/benchmarks/[slug]">): Promise<Metadata> {
  const b = await getProfile((await params).slug);
  if (!b) return {};
  return { title: `${b.name} — Benchmark Directory`, description: b.summary };
}

const remediationLabels: Record<string, string> = {
  not_checked: "Follow-up not yet checked",
  open: "Open",
  acknowledged: "Acknowledged by maintainers",
  resolved: "Resolved",
  wont_fix: "Won't fix",
  disputed: "Disputed by maintainers",
};

export default async function BenchmarkPage({ params }: PageProps<"/benchmarks/[slug]">) {
  const b = await getProfile((await params).slug);
  if (!b) notFound();

  const tasks = b.facts.find((f) => f.field === "task_count" && !f.version)?.value ?? null;
  const stars = b.githubStars;

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "facts", label: "Sourced facts" },
    ...(b.versions.length ? [{ id: "versions", label: "Versions" }] : []),
    { id: "adoption", label: "Adoption signals" },
    { id: "audits", label: "Audits & limitations" },
    ...(b.openGaps.length ? [{ id: "gaps", label: "Still being checked" }] : []),
    { id: "sources", label: "Sources" },
  ];
  const num = (id: string) => sections.findIndex((s) => s.id === id) + 1;

  return (
    <>
      <PageHero
        eyebrow={`Benchmark directory${b.track ? ` — ${tracks[b.track]}` : ""}`}
        title={b.name}
        lede={b.summary}
        back={{ href: benchmarksHref, label: "All benchmarks" }}
      />

      <Container className="pb-16">
        <StatGrid
          items={[
            {
              label: "GITHUB STARS",
              value: stars ? `${stars.rounded ? "≈" : ""}${stars.display}` : "Not measured",
              small: !stars,
            },
            { label: "TASKS", value: tasks ?? "Not established", small: !tasks },
            { label: "SOURCED FACTS", value: String(b.facts.length) },
            { label: "AUDITS", value: String(b.audits.length) },
            { label: "LAST CHECKED", value: formatDate(b.checkedOn) ?? "Unknown", small: true },
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
            <Link
              href={benchmarksHref}
              className="mt-6 hidden min-h-9 items-center text-[15px] font-medium text-ink hover:text-accent-ink lg:inline-flex"
            >
              ← All benchmarks
            </Link>
          </nav>

          <div className="flex min-w-0 flex-col gap-20">
            <Section id="overview" n={num("overview")} title="Overview">
              <Overview b={b} />
            </Section>

            <Section id="facts" n={num("facts")} title="Sourced facts">
              <p className="m-0 max-w-[62ch] text-ink-2">
                Each fact links to where it came from. <em>Reported</em> means the source says so; we haven&apos;t reproduced it.
              </p>
              <Facts facts={b.facts} />
            </Section>

            {b.versions.length > 0 && (
              <Section id="versions" n={num("versions")} title="Versions">
                <Table
                  caption={`Known versions of ${b.name}`}
                  head={["Version", "Released", "Tasks", "Pinned"]}
                  rows={b.versions.map((v) => [
                    <span key="l" className="font-medium text-ink">
                      {v.label}
                      {v.isDefault && <span className="ml-2 font-mono text-[12px] text-muted">default</span>}
                    </span>,
                    formatDate(v.releasedOn) ?? <Pending key="r">Unknown</Pending>,
                    v.taskCount !== null ? new Intl.NumberFormat("en").format(v.taskCount) : <Pending key="t">Unknown</Pending>,
                    v.pinned ? "Exact revision" : <Pending key="p">Not pinned</Pending>,
                  ])}
                />
              </Section>
            )}

            <Section id="adoption" n={num("adoption")} title="Adoption signals">
              {b.signals.length ? (
                <Table
                  caption={`Measured signals for ${b.name}`}
                  head={["Signal", "Value", "As of"]}
                  rows={b.signals.map((s) => [
                    s.name,
                    <span key="v" className="font-mono">
                      {s.rounded ? "≈" : ""}
                      {s.display}
                    </span>,
                    formatDate(s.observedOn),
                  ])}
                />
              ) : (
                <Note>No popularity measurements recorded yet.</Note>
              )}
              <Note>
                Lab adoption (which frontier labs report results on {b.name}) is still being collected from original model
                cards and launch posts. We won&apos;t show it until each report is sourced.
              </Note>
            </Section>

            <Section id="audits" n={num("audits")} title="Audits & limitations">
              {b.audits.length ? (
                <div>
                  {b.audits.map((a, i) => (
                    <Expandable
                      key={i}
                      title={`${a.auditor}${a.version ? ` — ${a.version}` : ""}`}
                      meta={[a.verdict, formatDate(a.date)].filter(Boolean).join(" · ")}
                      defaultOpen
                    >
                      <div className="flex flex-col gap-3">
                        {a.summary && <p className="m-0">{a.summary}</p>}
                        {a.affectedTasks !== null && (
                          <p className="m-0 font-mono text-[13px] text-muted">
                            At least {a.affectedTasks}
                            {a.reviewedTasks !== null && ` of ${a.reviewedTasks} reviewed`} tasks affected
                          </p>
                        )}
                        <p className="m-0 font-mono text-[13px] text-muted">
                          {remediationLabels[a.remediation] ?? a.remediation}
                        </p>
                      </div>
                    </Expandable>
                  ))}
                </div>
              ) : (
                <Note>No independent audits of {b.name} recorded yet.</Note>
              )}
            </Section>

            {b.openGaps.length > 0 && (
              <Section id="gaps" n={num("gaps")} title="Still being checked">
                <p className="m-0 max-w-[62ch] text-ink-2">
                  Open research on this entry. Until it&apos;s done, these areas are missing from the profile rather than guessed.
                </p>
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {b.openGaps.map((g, i) => (
                    <li key={i}>
                      <Tag tone="muted">{g.label}</Tag>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section id="sources" n={num("sources")} title="Sources">
              {b.sources.length ? (
                <ul className="m-0 flex list-none flex-col p-0">
                  {b.sources.map((s) => (
                    <li key={s.key} className="border-t border-line py-4 last:border-b">
                      <SourceLink source={s} primary={s.key === b.primarySource?.key} />
                    </li>
                  ))}
                </ul>
              ) : (
                <Note>No sources recorded.</Note>
              )}
            </Section>
          </div>
        </div>
      </Container>

      <Container className="py-10">
        <ArrowLink href={benchmarksHref}>All benchmarks</ArrowLink>
      </Container>

      <CtaStrip title="Benchmarks rank models. Your workload picks one." href={contactHref} label="Request a discovery call" />
    </>
  );
}

function Overview({ b }: { b: Profile }) {
  const rows: [string, ReactNode][] = [];
  if (kindLabels[b.kind]) rows.push(["Type", kindLabels[b.kind]]);
  if (b.relationships.length)
    rows.push([
      "Related",
      <ul key="r" className="m-0 flex list-none flex-col gap-1 p-0">
        {b.relationships.map((r) => (
          <li key={`${r.label}-${r.slug}`}>
            {r.label}{" "}
            {r.published ? (
              <Link href={`${benchmarksHref}/${r.slug}`} className="font-medium text-ink underline hover:text-accent-ink">
                {r.name}
              </Link>
            ) : (
              <span className="font-medium text-ink">{r.name}</span>
            )}
          </li>
        ))}
      </ul>,
    ]);
  if (b.aliases.length) rows.push(["Also known as", b.aliases.join(", ")]);
  rows.push(["Maintenance", b.maintenance ? maintenanceLabels[b.maintenance] : <Pending key="m">Not established</Pending>]);

  return (
    <>
      {b.capabilities.length > 0 && (
        <div className="flex flex-col gap-2">
          <SubLabel>Capabilities measured</SubLabel>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {b.capabilities.map((c) => (
              <li key={c.slug}>
                <Tag tone={c.primary ? "accent" : "muted"}>{c.name}</Tag>
              </li>
            ))}
          </ul>
        </div>
      )}
      <dl className="m-0 border-b border-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 border-t border-line py-4 sm:grid-cols-[200px_1fr] sm:gap-6">
            <dt className="font-mono text-xs tracking-[0.08em] text-muted uppercase sm:pt-1">{k}</dt>
            <dd className="m-0 text-ink-2">{v}</dd>
          </div>
        ))}
      </dl>
      {b.reviewedOn && (
        <p className="m-0 font-mono text-[13px] text-muted">Profile reviewed {formatDate(b.reviewedOn)}</p>
      )}
    </>
  );
}

function Facts({ facts }: { facts: Fact[] }) {
  if (!facts.length) return <Note>No sourced facts published yet.</Note>;
  return (
    <dl className="m-0 border-b border-line">
      {facts.map((f, i) => {
        const disputed = f.evidence.some((e) => e.role === "disputes");
        return (
          <div key={i} className="grid gap-2 border-t border-line py-5 sm:grid-cols-[200px_1fr] sm:gap-6">
            <dt className="flex flex-col gap-1.5 sm:pt-1">
              <span className="font-mono text-xs tracking-[0.08em] text-muted uppercase">{factLabel(f.field)}</span>
              {f.version && <span className="font-mono text-[12px] text-muted">Version {f.version}</span>}
            </dt>
            <dd className="m-0 flex flex-col gap-2">
              <span className="text-[17px] text-ink">{f.value}</span>
              <span className="flex flex-wrap items-center gap-2">
                <Tag tone={f.status === "verified" ? "accent" : "muted"}>{verificationLabels[f.status]}</Tag>
                {disputed && <Tag>Disputed by another source</Tag>}
              </span>
              {f.evidence.map((e, j) => (
                <span key={j} className="text-[14px] text-ink-2">
                  {e.role === "disputes" ? "Disputed by " : e.role === "context" ? "Context: " : "Source: "}
                  <a href={e.source.url} target="_blank" rel="noopener noreferrer" className="text-ink underline hover:text-accent-ink">
                    {e.source.title} ↗
                  </a>
                  {e.locator && <span className="text-muted"> — {e.locator}</span>}
                  {e.excerpt && <q className="mt-1 block text-ink-2 italic">{e.excerpt}</q>}
                </span>
              ))}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function SourceLink({ source: s, primary }: { source: Source; primary: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <a
        href={s.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[17px] font-medium text-ink hover:text-accent-ink"
      >
        {s.title} ↗
      </a>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px] text-muted">
        {s.publisher && <span>{s.publisher}</span>}
        {s.retrievedOn && <span>Read {formatDate(s.retrievedOn)}</span>}
        {primary && <span className="text-accent-ink">Primary source</span>}
      </span>
    </div>
  );
}

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-[15px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-ink text-left">
            {head.map((h) => (
              <th key={h} scope="col" className="py-2 pr-4 font-mono text-xs font-normal text-muted uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line">
              {r.map((c, j) => (
                <td key={j} className="py-2.5 pr-4 text-ink-2">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

function Note({ children }: { children: ReactNode }) {
  return <p className="m-0 border-l-2 border-accent pl-4 font-mono text-[13px] text-muted">{children}</p>;
}
