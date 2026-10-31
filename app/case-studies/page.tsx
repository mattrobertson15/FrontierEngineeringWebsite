import type { Metadata } from "next";
import Link from "next/link";
import { caseStudiesHref, contactHref } from "@/lib/site";
import { caseStudies } from "@/content/case-studies";
import { Container, CtaStrip, HairlineGrid, PageHero } from "@/components/ui";

export const metadata: Metadata = {
  title: "Case Studies",
  description: "What Frontier Engineering engagements set out to do, how we ran them, and what changed.",
};

export default function CaseStudiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Our work — Case studies"
        title="Work we've shipped with our clients."
        lede="What each client needed, how we approached it, and what changed afterwards."
      />

      <Container className="pt-6 pb-26">
        <HairlineGrid min={320} as="ul">
          {caseStudies.map((c) => (
            <li key={c.slug} className="flex">
              <Link
                href={`${caseStudiesHref}/${c.slug}`}
                className="group flex flex-1 flex-col gap-3.5 bg-surface p-8 hover:bg-paper"
              >
                <span className="font-mono text-[13px] text-accent-ink">
                  {c.offering} · {c.industry}
                </span>
                <h2 className="m-0 text-[22px] font-semibold group-hover:text-accent-ink">{c.title}</h2>
                <p className="m-0 flex-1 text-ink-2">{c.summary}</p>
                <span className="font-medium text-ink group-hover:text-accent-ink">Read the case study →</span>
              </Link>
            </li>
          ))}
        </HairlineGrid>
      </Container>

      <CtaStrip title="Have a similar problem?" href={contactHref} label="Request a discovery call" />
    </>
  );
}
