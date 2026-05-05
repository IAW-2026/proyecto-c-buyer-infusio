import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "http2.mlstatic.com" },
      { protocol: "https", hostname: "acdn-us.mitiendanube.com" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      { protocol: "https", hostname: "statics.dinoonline.com.ar" },
      { protocol: "https", hostname: "jesper.com.ar" },
      { protocol: "https", hostname: "newsite.fazenda.com.ar" },
      { protocol: "https", hostname: "www.connectroasters.com" },
    ],
  },
};

export default nextConfig;
