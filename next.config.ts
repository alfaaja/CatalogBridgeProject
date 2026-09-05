import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allows a full 1 MiB HTML file plus the small multipart form envelope.
      bodySizeLimit: "1100kb",
    },
  },
  images: {
    remotePatterns: [
      {
        hostname: "static.jakmall.id",
        pathname: "/**",
        port: "",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
