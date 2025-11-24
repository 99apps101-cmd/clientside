import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep TypeScript checking enabled for compile errors only
    ignoreBuildErrors: false,
  },
};

export default nextConfig;