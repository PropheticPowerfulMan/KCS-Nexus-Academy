import{prepareNext}from'./client-runtime/next.mjs';
import{resolve}from'node:path';
const clientRelease=prepareNext(resolve('.'),[{"app": "KCS_ACADEMY", "scope": "/"}]);
import type { NextConfig } from "next";
const nextConfig: NextConfig = { output: "standalone", images: { unoptimized: true }, env: { NEXT_PUBLIC_BASE_PATH: "", NEXT_PUBLIC_KCS_CLIENT_VERSION:clientRelease.id } };
export default nextConfig;
