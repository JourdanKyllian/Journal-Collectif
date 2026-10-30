import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://journal-collectif-api.onrender.com/api/:path*'
      },
      {
        source: '/uploads/:path*',
        destination: 'https://journal-collectif-api.onrender.com/uploads/:path*'
      }
    ];
  }
};

export default nextConfig;
