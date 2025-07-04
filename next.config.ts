import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer"
// import removeImports from "next-remove-imports"

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZER == 'true'
})

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,

};

export default withAnalyzer(nextConfig);
