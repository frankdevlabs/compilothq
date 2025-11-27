import 'dotenv/config'

import path from 'node:path'

import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: path.join(import.meta.dirname, 'prisma/schema.prisma'),

  // Datasource configuration (required by Prisma 7 for migration commands)
  datasource: {
    url: env('DATABASE_URL'),
  },

  // Migration configuration
  migrations: {
    path: path.join(import.meta.dirname, 'prisma/migrations'),
    seed: 'tsx prisma/seed.ts',
  },
})
