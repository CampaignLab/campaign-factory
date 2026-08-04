import type { NextConfig } from "next";

// Keep this local config even while it is empty: without it, Next.js discovers
// ../../next.config.ts and silently inherits another app's settings.

// Self-hosted Umami on Railway. The tracker is proxied through this origin so
// ad-blockers that filter known analytics hosts don't drop it; the tracker
// derives its /api/send endpoint from the script's own URL, so both paths must
// share the /stats prefix.
const UMAMI_HOST =
  process.env.UMAMI_HOST ?? "https://sugaroverflow-analytics.up.railway.app";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/stats/script.js", destination: `${UMAMI_HOST}/script.js` },
      { source: "/stats/api/send", destination: `${UMAMI_HOST}/api/send` },
    ];
  },
};

export default nextConfig;
