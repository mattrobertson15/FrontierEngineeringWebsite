import type { MetadataRoute } from "next";
import { practices, researchHref, siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, priority: 1 },
    ...practices.map((p) => ({ url: `${siteUrl}${p.href}`, priority: 0.8 })),
    { url: `${siteUrl}${researchHref}`, priority: 0.7 },
  ];
}
