import type { MetadataRoute } from "next";
import { offerings, practices, researchHref, siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, priority: 1 },
    ...offerings.map((o) => ({ url: `${siteUrl}${o.href}`, priority: 0.9 })),
    ...practices.map((p) => ({ url: `${siteUrl}${p.href}`, priority: 0.8 })),
    { url: `${siteUrl}${researchHref}`, priority: 0.7 },
  ];
}
