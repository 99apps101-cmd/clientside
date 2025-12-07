import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Keep TypeScript checking enabled for compile errors only
    ignoreBuildErrors: false,
  },
};

export default nextConfig;