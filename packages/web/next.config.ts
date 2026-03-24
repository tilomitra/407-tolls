import type { NextConfig } from "next";
import { join } from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@407-tolls/core"],
  outputFileTracingRoot: join(import.meta.dirname, "..", ".."),
};

export default nextConfig;
