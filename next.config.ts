import type { NextConfig } from "next";
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";
const basePath = isGitHubPages ? "/KCS-Nexus-Academy" : "";
const nextConfig: NextConfig = isGitHubPages ? {
  output: "export", basePath, assetPrefix: basePath, images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath, ACADEMY_DEMO_MODE: "true" }
} : { output: "standalone", images: { unoptimized: true }, env: { NEXT_PUBLIC_BASE_PATH: "" } };
export default nextConfig;
