import type { NextConfig } from "next";

const imgSrc = [
  "https://http2.mlstatic.com",
  "https://acdn-us.mitiendanube.com",
  "https://encrypted-tbn0.gstatic.com",
  "https://statics.dinoonline.com.ar",
  "https://jesper.com.ar",
  "https://newsite.fazenda.com.ar",
  "https://www.connectroasters.com",
  "https://beanswithoutborders.com",
  "https://*.maptiler.com",
  "https://*.clerk.com",
  "https://*.clerk.accounts.dev",
].join(" ");

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${imgSrc}`,
  "font-src 'self'",
  `connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.com https://api.maptiler.com wss://*.clerk.accounts.dev`,
  "frame-src https://api.maptiler.com",
  "frame-ancestors 'self'",
  "worker-src blob:",
].join("; ");

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "http2.mlstatic.com" },
      { protocol: "https", hostname: "acdn-us.mitiendanube.com" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      { protocol: "https", hostname: "statics.dinoonline.com.ar" },
      { protocol: "https", hostname: "jesper.com.ar" },
      { protocol: "https", hostname: "newsite.fazenda.com.ar" },
      { protocol: "https", hostname: "www.connectroasters.com" },
      { protocol: "https", hostname: "beanswithoutborders.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",        value: "nosniff" },
          { key: "X-Frame-Options",               value: "SAMEORIGIN" },
          { key: "Referrer-Policy",               value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Opener-Policy",    value: "same-origin-allow-popups" },
          { key: "Permissions-Policy",            value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy",       value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
