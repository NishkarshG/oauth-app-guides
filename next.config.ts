import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/**": ["./src/data/guides/**"] },
};

export default nextConfig;
