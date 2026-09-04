import type { MetadataRoute } from "next";

// robots.txt is world-readable, so it deliberately lists NOTHING private.
//
// Putting the feedback board's path in a Disallow rule would publish the exact URL we are
// trying to keep quiet — "disallow" is a request to crawlers, not a lock, and the file is
// the first place anyone curious looks. The board is kept out of search by a noindex tag on
// the page itself instead, which reveals nothing here.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://www.odysra.com/sitemap.xml",
  };
}
