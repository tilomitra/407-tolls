import type { MetadataRoute } from "next";
import { interchanges } from "@/data";
import { buildSlugRoute } from "@/lib/slugs";
import { BASE_URL } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
  ];

  for (const entry of interchanges) {
    for (const exit of interchanges) {
      if (entry.id === exit.id) continue;
      const slug = buildSlugRoute(entry.id, exit.id);

      entries.push({
        url: `${BASE_URL}/trip/${slug}`,
        changeFrequency: "monthly",
        priority: 0.8,
      });
      entries.push({
        url: `${BASE_URL}/commute/${slug}`,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
