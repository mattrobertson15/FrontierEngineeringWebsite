import type { Metadata } from "next";
import Link from "next/link";
import { benchmarksHref, contactHref } from "@/lib/site";
import {
  assessmentAxes,
  benchmarks,
  benchmarksLaunched,
  categories,
  dataAsOf,
  hasSignalData,
  labs,
  labsReporting,
} from "@/content/benchmarks";
import { BenchmarkDirectory } from "@/components/BenchmarkDirectory";
import { Expandable } from "@/components/benchmarks";
import { AutoGrid, Container, CtaStrip, Eyebrow, H2, PageHero, StatGrid } from "@/components/ui";

export const metadata: Metadata = {
  title: "Benchmark Intelligence Directory",
  description:
    "The AI benchmarks frontier labs report: how each one works, what it really measures, and how widely it is used.",
  robots: benchmarksLaunched ? undefined : { index: false, follow: false },
};

const signalGuide = [
  {
    title: "GitHub stars",
    meta: "Popularity",
    body: "Stars on the benchmark's main repository. A rough measure of developer attention. It favours benchmarks that ship runnable code, and says nothing about quality on its own.",
  },
  {
    title: "Paper citations",
    meta: "Academic reach",
    body: "Citations of the benchmark's primary paper. This measures how much the research community builds on or compares against it. It lags for new benchmarks.",
  },
  {
    title: "Lab adoption",
    meta: "Industry validity",
    body: `How many of the ${labs.length} frontier labs we track have reported a result on the benchmark in a model card, system card, launch post or paper. This is the strongest signal of the three: a lab choosing to report a number is a statement that the number matters.`,
  },
];

export default function BenchmarksPage() {
  return (
    <>
      <PageHero
        eyebrow="Research — Benchmark intelligence directory"
        title="The benchmarks behind every model launch."
        lede="What each benchmark actually measures, how it's built, where it falls short, and how much weight the industry gives it. Start with the summary, and open any entry for more detail."
      />

      <Container className="pb-14">
        <StatGrid
          items={[
            { label: "BENCHMARKS", value: String(benchmarks.length) },
            { label: "CATEGORIES", value: String(Object.keys(categories).length) },
            { label: "FRONTIER LABS TRACKED", value: String(labs.length) },
            { label: "SIGNALS UPDATED", value: dataAsOf ?? "First pull pending", small: !dataAsOf },
          ]}
        />
      </Container>

      <Container className="pb-26">
        <BenchmarkDirectory />
      </Container>

      {/* ---- adoption matrix ---- */}
      <section className="border-t border-line bg-surface">
        <Container className="flex flex-col gap-10 py-26">
          <div className="flex max-w-[720px] flex-col gap-3.5">
            <Eyebrow>Adoption at a glance</Eyebrow>
            <H2>Which labs report what.</H2>
            <p className="m-0 text-ink-2">
              A filled cell means the lab has published a result on that benchmark. Benchmarks that every lab reports are
              the ones the industry agrees on.
            </p>
          </div>
          <AdoptionMatrix />
        </Container>
      </section>

      {/* ---- how to read ---- */}
      <Container className="py-26">
        <AutoGrid min={320} className="items-start gap-12">
          <div className="flex flex-col gap-3.5">
            <Eyebrow>How to read this directory</Eyebrow>
            <H2>Popularity isn&apos;t validity.</H2>
            <p className="m-0 text-ink-2">
              We report measured signals as they are, and give our own read separately, so you can tell which is which.
            </p>
          </div>
          <div className="flex flex-col gap-10">
            <div>
              <p className="m-0 mb-2 font-mono text-xs tracking-[0.08em] text-muted uppercase">Measured signals</p>
              {signalGuide.map((s) => (
                <Expandable key={s.title} title={s.title} meta={s.meta}>
                  <p className="m-0">{s.body}</p>
                </Expandable>
              ))}
            </div>
            <div>
              <p className="m-0 mb-2 font-mono text-xs tracking-[0.08em] text-muted uppercase">Our assessment</p>
              {Object.values(assessmentAxes).map((a) => (
                <Expandable key={a.label} title={a.label} meta="Low · Medium · High">
                  <p className="m-0">{a.help}</p>
                </Expandable>
              ))}
            </div>
          </div>
        </AutoGrid>
      </Container>

      <CtaStrip
        title="Benchmarks rank models. Your workload picks one."
        href={contactHref}
        label="Request a discovery call"
      />
    </>
  );
}

function AdoptionMatrix() {
  const rows = [...benchmarks].sort((a, b) => labsReporting(b).length - labsReporting(a).length);
  return (
    <div className="flex flex-col gap-4">
      {!hasSignalData && (
        <p className="m-0 border-l-2 border-accent pl-4 font-mono text-[13px] text-muted">
          Lab citation data is being collected. Cells fill in when the first pull lands.
        </p>
      )}
      <div className="overflow-x-auto border border-line bg-paper">
        <table className="w-full min-w-[760px] border-collapse text-[14px]">
          <caption className="sr-only">Frontier labs that have reported results on each benchmark</caption>
          <thead>
            <tr className="border-b border-ink">
              <th scope="col" className="sticky left-0 bg-paper px-4 py-3 text-left font-mono text-xs font-normal text-muted uppercase">
                Benchmark
              </th>
              {labs.map((lab) => (
                <th key={lab} scope="col" className="px-2 py-3 text-center font-mono text-[11px] font-normal text-muted">
                  {lab}
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-right font-mono text-xs font-normal text-muted uppercase">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const reporting = labsReporting(b);
              return (
                <tr key={b.slug} className="group border-b border-line last:border-b-0">
                  <th scope="row" className="sticky left-0 bg-paper px-4 py-3 text-left font-medium group-hover:bg-surface">
                    <Link href={`${benchmarksHref}/${b.slug}`} className="hover:text-accent-ink">
                      {b.name}
                    </Link>
                  </th>
                  {labs.map((lab) => {
                    const yes = reporting.includes(lab);
                    return (
                      <td key={lab} className="px-2 py-3 text-center">
                        <span
                          className={`inline-block size-3 rounded-full ${yes ? "bg-accent" : "border border-line"}`}
                          aria-label={yes ? `${lab}: reported` : `${lab}: not reported`}
                          role="img"
                        />
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right font-mono">
                    {reporting.length}/{labs.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
