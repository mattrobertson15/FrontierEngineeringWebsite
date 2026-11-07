import type { Metadata } from "next";
import { contactHref } from "@/lib/site";
import { getDirectory } from "@/lib/benchmarks/data";
import { formatDate } from "@/lib/benchmarks/types";
import { BenchmarkDirectory } from "@/components/BenchmarkDirectory";
import { Expandable } from "@/components/benchmarks";
import { AutoGrid, Container, CtaStrip, Eyebrow, H2, PageHero, StatGrid } from "@/components/ui";

export const metadata: Metadata = {
  title: "Benchmark Intelligence Directory",
  description:
    "The AI benchmarks behind model launches: what each one measures, how it is built, and what independent audits have found. Every fact is sourced.",
};

const readingGuide = [
  {
    title: "Every fact links to its source",
    meta: "Evidence",
    body: "Each number or statement on a profile is tied to the document it came from, with where in that document to look and the date we read it. If we can't source a fact, we leave it out.",
  },
  {
    title: "Reported isn't the same as verified",
    meta: "Status",
    body: "Reported means the source says so. Verified means we checked it independently. Most facts start as reported. Confirming that a publisher reported a score is not the same as reproducing that score.",
  },
  {
    title: "Missing means unknown",
    meta: "Gaps",
    body: "A blank is a fact we haven't established, never a zero. Profiles list what is still being checked, so you can see what the page doesn't cover.",
  },
  {
    title: "Audits belong to their auditors",
    meta: "Limitations",
    body: "When an outside group audits a benchmark, we report their verdict and scope as they stated it, for the version they reviewed. A finding about one release isn't a judgement on every release.",
  },
];

export default async function BenchmarksPage() {
  const entries = await getDirectory();
  const lastChecked = entries.reduce<string | null>(
    (max, e) => (e.checkedOn && (!max || e.checkedOn > max) ? e.checkedOn : max),
    null,
  );
  const facts = entries.reduce((n, e) => n + e.factCount, 0);
  const capabilities = new Set(entries.flatMap((e) => e.capabilities.map((c) => c.slug))).size;

  return (
    <>
      <PageHero
        eyebrow="Research — Benchmark intelligence directory"
        title="The benchmarks behind every model launch."
        lede="What each benchmark actually measures, how it's built, and what independent audits have found. Every fact is sourced. Start with the summary, and open any entry for more detail."
      />

      <Container className="pb-14">
        <StatGrid
          items={[
            { label: "PUBLISHED PROFILES", value: String(entries.length) },
            { label: "CAPABILITIES COVERED", value: String(capabilities) },
            { label: "SOURCED FACTS", value: String(facts) },
            { label: "LAST CHECKED", value: formatDate(lastChecked) ?? "—", small: true },
          ]}
        />
      </Container>

      <Container className="pb-26">
        <BenchmarkDirectory entries={entries} />
      </Container>

      {/* ---- how to read ---- */}
      <section className="border-t border-line bg-surface">
        <Container className="py-26">
          <AutoGrid min={320} className="items-start gap-12">
            <div className="flex flex-col gap-3.5">
              <Eyebrow>How to read this directory</Eyebrow>
              <H2>Sourced, dated, and honest about gaps.</H2>
              <p className="m-0 text-ink-2">
                We publish an entry only after its sources have been reviewed. What we know and what we don&apos;t are kept
                apart, so you can tell which is which.
              </p>
            </div>
            <div>
              {readingGuide.map((s) => (
                <Expandable key={s.title} title={s.title} meta={s.meta}>
                  <p className="m-0">{s.body}</p>
                </Expandable>
              ))}
            </div>
          </AutoGrid>
        </Container>
      </section>

      <CtaStrip
        title="Benchmarks rank models. Your workload picks one."
        href={contactHref}
        label="Request a discovery call"
      />
    </>
  );
}
