import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@compilothq/database', '@compilothq/ui', '@compilothq/validation'],
  images: {
    domains: [],
  },
}

export default nextConfig
