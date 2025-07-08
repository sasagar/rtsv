import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        {
          "socket.io": "commonjs socket.io",
        },
      ];
    }
    return config;
  },
};

export default nextConfig;
