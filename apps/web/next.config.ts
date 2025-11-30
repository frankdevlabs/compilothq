import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@compilothq/database', '@compilothq/ui', '@compilothq/validation'],
  images: {
    domains: [],
  },
  webpack: (config: { resolve: { extensionAlias?: Record<string, string[]> } }) => {
    // Allow webpack to resolve .js imports to .ts files for Prisma 7
    // Turbopack doesn't support extensionAlias yet (https://github.com/vercel/next.js/issues/82945)
    // so we use webpack with --webpack flag in package.json scripts
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.js'],
      '.mjs': ['.mts', '.mjs'],
    }
    return config
  },
}

export default nextConfig
