import type { MetadataRoute } from "next";

// Only the two pages that are genuinely public. Dashboards, the demo gate and the private
// feedback board are all left out on purpose — a sitemap is a published document.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: "https://www.odysra.com", lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: "https://www.odysra.com/bon-bon-stall", lastModified: now, changeFrequency: "daily", priority: 0.8 },
  ];
}
