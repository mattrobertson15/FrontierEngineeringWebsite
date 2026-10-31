import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { caseStudiesHref, contactHref } from "@/lib/site";
import { caseStudies, caseStudy } from "@/content/case-studies";
import {
  ArrowLink,
  AutoGrid,
  Container,
  CtaStrip,
  DarkBand,
  Eyebrow,
  H2,
  Label,
  PageHero,
  StatGrid,
} from "@/components/ui";

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/case-studies/[slug]">): Promise<Metadata> {
  const study = caseStudy((await params).slug);
  if (!study) return {};
  return { title: `${study.client} — Case Study`, description: study.summary };
}

export default async function CaseStudyPage({ params }: PageProps<"/case-studies/[slug]">) {
  const study = caseStudy((await params).slug);
  if (!study) notFound();

  return (
    <>
      <PageHero
        eyebrow={`Case study — ${study.client} · ${study.industry}`}
        title={study.title}
        lede={study.summary}
      />

      <Container className="pb-18">
        <StatGrid items={[{ label: "ENGAGEMENT", value: study.offering, small: true }, ...study.stats]} />
      </Container>

      <Container className="pb-26">
        <AutoGrid min={320} className="items-start gap-12">
          <div className="flex flex-col gap-4">
            <Eyebrow>The challenge</Eyebrow>
            <p className="m-0 text-[19px] text-ink-2">{study.challenge}</p>
          </div>
          <div className="flex flex-col gap-4">
            <Label>What we did</Label>
            <ol className="m-0 flex list-none flex-col p-0">
              {study.approach.map((step, i) => (
                <li key={i} className="grid grid-cols-[48px_1fr] gap-3 border-t border-line py-[18px]">
                  <span className="font-mono text-[15px] text-accent-ink">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="m-0 font-medium">{step.title}</p>
                    <p className="m-0 text-ink-2">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </AutoGrid>
      </Container>

      <DarkBand>
        <Container className="flex flex-col gap-8 py-26">
          <div className="flex max-w-[760px] flex-col gap-4">
            <Eyebrow dark>The outcome</Eyebrow>
            <H2 dark>{study.outcome}</H2>
          </div>
          {study.quote && (
            <figure className="m-0 flex max-w-[680px] flex-col gap-3 border-l border-night-line pl-6">
              <blockquote className="m-0 text-xl text-night-text">“{study.quote.text}”</blockquote>
              <figcaption className="font-mono text-xs text-night-muted">{study.quote.attribution}</figcaption>
            </figure>
          )}
        </Container>
      </DarkBand>

      <Container className="py-10">
        <ArrowLink href={caseStudiesHref}>All case studies</ArrowLink>
      </Container>

      <CtaStrip title="Have a similar problem?" href={contactHref} label="Request a discovery call" />
    </>
  );
}
