import { PrismaClient } from '@prisma/client'

// Prevent multiple Prisma Client instances in development
// This singleton pattern ensures connection pooling works correctly in serverless environments
// and prevents the "too many connections" error during Next.js hot reload

declare global {
  var prisma: PrismaClient | undefined
}

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
