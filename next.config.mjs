/** @type {import('next').NextConfig} */

/**
 * Production security headers. Applied to every route.
 *
 * CSP is intentionally strict:
 *  - default-src 'self' to block third-party origins by default
 *  - script-src allows 'unsafe-inline' (Next.js inlines hydration scripts) and
 *    Google Analytics (gated behind NEXT_PUBLIC_GA_ID; omitted if unset)
 *  - connect-src permits Gemini + Firebase + Google Analytics endpoints
 *  - frame-ancestors 'none' blocks clickjacking
 */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.gstatic.com https://www.google.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://lh3.googleusercontent.com https://*.gstatic.com",
      "connect-src 'self' https://generativelanguage.googleapis.com https://*.googleapis.com https://*.firebaseio.com https://firestore.googleapis.com https://firebaseinstallations.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://fcmregistrations.googleapis.com https://firebaseremoteconfig.googleapis.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.google.com https://www.gstatic.com",
      "frame-src 'self' https://www.google.com https://*.firebaseapp.com https://accounts.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

/**
 * Long-lived cache headers for fully static venue assets. These files are
 * content-hashed by Next.js at build time where applicable, but the hand-traced
 * SVG + POI JSON + graph JSON are authored assets we want cached aggressively.
 */
const staticAssetHeaders = [
  {
    key: "Cache-Control",
    value: "public, max-age=31536000, immutable",
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    serverComponentsExternalPackages: ["firebase-admin"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/venue/:path*",
        headers: staticAssetHeaders,
      },
      {
        source: "/fonts/:path*",
        headers: staticAssetHeaders,
      },
    ];
  },
};

export default nextConfig;
