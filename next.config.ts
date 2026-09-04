import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { qualities: [75, 90] },
  // Lets a phone on the LAN load the dev server's assets and HMR.
  allowedDevOrigins: ["192.168.1.5"],
};

export default nextConfig;
