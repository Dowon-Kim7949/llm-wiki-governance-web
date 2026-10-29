import type { NextConfig } from "next";

// GitHub Pages serves this site under /<repo>/. The deploy workflow passes the
// path that actions/configure-pages reports; local builds serve from the root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
