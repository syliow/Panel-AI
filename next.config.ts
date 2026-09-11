import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // Run lint separately with npm run lint.
  eslint: {
    ignoreDuringBuilds: true, // Avoid running ESLint twice
  },
  typescript: {
    ignoreBuildErrors: false, // Keep type checking
  },
  
  // Headers for security and WebSocket support
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
