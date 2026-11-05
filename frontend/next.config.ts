import type { NextConfig } from "next";

/**
 * The browser only ever talks to this Next.js app (same origin). These rewrites forward
 * API calls to Django, so Django's session and CSRF cookies stay first-party
 * (technical.md §13). BACKEND_URL is read when `next dev` starts, or at `next build`
 * time for production builds.
 */
const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:8000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Django's URLs end with "/". Keep paths exactly as written instead of redirecting.
  skipTrailingSlashRedirect: true,
  // Don't let `next dev` write an AGENTS.md file; agents read CLAUDE.md in this repo.
  agentRules: false,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backendUrl}/api/:path*` },
      { source: "/_allauth/:path*", destination: `${backendUrl}/_allauth/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
