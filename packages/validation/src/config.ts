import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(16),
  NEXT_PUBLIC_APP_NAME: z.string(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_FEATURE_QUESTIONNAIRES: z.string().transform((val) => val === 'true'),
  NEXT_PUBLIC_FEATURE_DOCUMENT_GENERATION: z.string().transform((val) => val === 'true'),
  NEXT_PUBLIC_FEATURE_AI_ASSISTANCE: z.string().transform((val) => val === 'true'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables')
}

export const env = parsed.data

export const features = {
  questionnaires: env.NEXT_PUBLIC_FEATURE_QUESTIONNAIRES,
  documentGeneration: env.NEXT_PUBLIC_FEATURE_DOCUMENT_GENERATION,
  aiAssistance: env.NEXT_PUBLIC_FEATURE_AI_ASSISTANCE,
} as const

export const config = {
  app: {
    name: env.NEXT_PUBLIC_APP_NAME,
    url: env.NEXT_PUBLIC_APP_URL,
  },
  auth: {
    url: env.NEXTAUTH_URL,
  },
  features,
} as const
