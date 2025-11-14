import type { NextConfig } from "next";
// import withBundleAnalyzer from "@next/bundle-analyzer"
// // import removeImports from "next-remove-imports"

// const withAnalyzer = withBundleAnalyzer({
//   enabled: process.env.ANALYZER == 'true'
// })

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["lh3.googleusercontent.com"]
  },
  experimental: {
    optimizePackageImports: []
  },
};

export default nextConfig;
