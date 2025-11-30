import 'dotenv/config'

import path from 'node:path'

import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.join(import.meta.dirname, 'prisma/schema.prisma'),

  // Datasource configuration - CONDITIONAL for Prisma 7 compatibility
  // Why conditional? In CI, DATABASE_URL is NOT available during pnpm install (postinstall phase)
  // but IS available during migration step. Making this conditional allows:
  // - prisma generate (postinstall): Works without DATABASE_URL, uses schema provider
  // - prisma migrate (CI step): Works with DATABASE_URL from job environment
  // - Local dev: Works with .env file loaded by dotenv/config above
  datasource: process.env['DATABASE_URL']
    ? {
        url: process.env['DATABASE_URL'],
      }
    : undefined,

  // Migration configuration
  migrations: {
    path: path.join(import.meta.dirname, 'prisma/migrations'),
    seed: 'tsx prisma/seed.ts',
  },
})
