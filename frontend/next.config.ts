import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // H2: Enable strict mode for better React error detection
  reactStrictMode: true,

  // Allow images from localhost backend (and production domain when configured)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
      // Production backend — set NEXT_PUBLIC_API_HOST in .env.production
      ...(process.env.NEXT_PUBLIC_API_HOST
        ? [
            {
              protocol: 'https' as const,
              hostname: process.env.NEXT_PUBLIC_API_HOST,
              pathname: '/**',
            },
          ]
        : []),
    ],
  },

  // H2: Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
