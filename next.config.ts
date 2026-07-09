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
    ];
  },
  // Serve the static study planner (public/harsith.html) at the clean /harsith URL
  async rewrites() {
    return [{ source: "/harsith", destination: "/harsith.html" }];
  },
};

export default nextConfig;
