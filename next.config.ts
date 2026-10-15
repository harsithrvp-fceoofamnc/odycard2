import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Capacitor: allows the Android WebView to load images/assets from the Next.js server
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      // OdyDesk demos: always fetch the newest page after a deploy (phones were showing an old copy)
      {
        source: "/odydesk/:app/index.html",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
  // Serve the static study planner (public/harsith.html) at the clean /harsith URL
  async rewrites() {
    return [{ source: "/harsith", destination: "/harsith.html" }];
  },
};

export default nextConfig;
