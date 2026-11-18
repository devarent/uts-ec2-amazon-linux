import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required so the Docker image only ships the files the server needs.
  output: "standalone",
  // `pg` memakai require dinamis; biarkan Node me-resolve saat runtime.
  serverExternalPackages: ["pg"],
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
};

export default nextConfig;
