import type { MetadataRoute } from "next";
import { careersHref, caseStudiesHref, offerings, practices, researchHref, siteUrl } from "@/lib/site";
import { caseStudies } from "@/content/case-studies";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, priority: 1 },
    ...offerings.map((o) => ({ url: `${siteUrl}${o.href}`, priority: 0.9 })),
    ...practices.map((p) => ({ url: `${siteUrl}${p.href}`, priority: 0.8 })),
    { url: `${siteUrl}${researchHref}`, priority: 0.7 },
    { url: `${siteUrl}${caseStudiesHref}`, priority: 0.7 },
    ...caseStudies.map((c) => ({ url: `${siteUrl}${caseStudiesHref}/${c.slug}`, priority: 0.6 })),
    { url: `${siteUrl}${careersHref}`, priority: 0.5 },
  ];
}
