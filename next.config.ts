import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/super-admin/analytics',
        destination: '/super-admin/dashboard',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
