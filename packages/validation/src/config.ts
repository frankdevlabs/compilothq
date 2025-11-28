import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),

  // NextAuth.js Configuration
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(16),

  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Email Provider (Resend)
  RESEND_API_KEY: z.string().optional(),

  // App Configuration
  NEXT_PUBLIC_APP_NAME: z.string(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),

  // Feature Flags
  NEXT_PUBLIC_FEATURE_QUESTIONNAIRES: z.string().transform((val) => val === 'true'),
  NEXT_PUBLIC_FEATURE_DOCUMENT_GENERATION: z.string().transform((val) => val === 'true'),
  NEXT_PUBLIC_FEATURE_AI_ASSISTANCE: z.string().transform((val) => val === 'true'),
})

/**
 * Skip validation during builds (Next.js static generation workers don't inherit env vars)
 * This is a standard pattern used by T3 Stack and other Next.js apps
 */
const skipValidation = process.env['SKIP_ENV_VALIDATION'] === 'true'

type EnvType = z.infer<typeof envSchema>

let env: EnvType

if (skipValidation) {
  // Provide placeholder values during build - these are never used at runtime
  env = {
    DATABASE_URL: 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
    NEXTAUTH_URL: 'http://localhost:3000',
    NEXTAUTH_SECRET: 'build-time-placeholder-not-for-production',
    GOOGLE_CLIENT_ID: undefined,
    GOOGLE_CLIENT_SECRET: undefined,
    RESEND_API_KEY: undefined,
    NEXT_PUBLIC_APP_NAME: 'Compilo',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NODE_ENV: 'production',
    NEXT_PUBLIC_FEATURE_QUESTIONNAIRES: false,
    NEXT_PUBLIC_FEATURE_DOCUMENT_GENERATION: false,
    NEXT_PUBLIC_FEATURE_AI_ASSISTANCE: false,
  }
} else {
  /**
   * Parse and validate environment variables
   * In test mode, we defer validation to allow test setup to load .env.test first
   */
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    // In test mode, provide a more helpful error message
    if (process.env['NODE_ENV'] === 'test') {
      console.error(
        '\n⚠️  Environment variables not loaded yet. This usually means test setup has not run.\n' +
          'Ensure your test file imports from this package AFTER setup files have loaded .env.test\n'
      )
    }
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }
  env = parsed.data
}

export { env }

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
    secret: env.NEXTAUTH_SECRET,
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    email: {
      resendApiKey: env.RESEND_API_KEY,
    },
  },
  features,
} as const
