import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@netlify/blobs"],
  outputFileTracingIncludes: { "/**": ["./src/data/guides/**"] },
};

export default nextConfig;
