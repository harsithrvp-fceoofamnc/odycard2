import type { MetadataRoute } from "next";

// A sitemap is a published document, so it lists only the front door.
export default function sitemap(): MetadataRoute.Sitemap {
  // Every page now sits behind the site login, so there is nothing for a crawler to
  // fetch but the front door. Listing gated paths would only advertise them.
  return [
    { url: "https://www.odysra.com", lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
  ];
}
