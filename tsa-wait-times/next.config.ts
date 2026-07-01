import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Cursor cloud agent port-forward hostnames to receive HMR updates
  allowedDevOrigins: [
    "*.agent.cvm.dev",
    "*.cursor.sh",
    // Exact hostname observed in logs – add more as needed
    "p-3000-pod-osjdc6jtjfdw5fgitujnnumgdm-1ea1adffdccf30dce46a-us3p.agent.cvm.dev",
  ],
};

export default nextConfig;
