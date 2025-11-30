import { createDevSession, type UserPersona } from '@compilothq/database'
import { type BrowserContext, type Page } from '@playwright/test'

import { AUTH_COOKIE_CONFIG } from '@/lib/auth/config'

/**
 * Generate a development session token for a given persona
 *
 * @param persona - The user persona to authenticate as
 * @returns Session token string
 */
export async function generateDevSessionToken(persona: UserPersona): Promise<string> {
  const { token } = await createDevSession(persona)
  return token
}

/**
 * Verify authentication is working by calling the session endpoint
 * This confirms the cookie was set correctly and NextAuth can read the session
 *
 * NOTE: We don't navigate to any page here - we just verify the cookie is set
 * and the session API recognizes it. This avoids navigation timing conflicts.
 */
async function verifyAuthentication(page: Page, persona: UserPersona): Promise<void> {
  // Verify the cookie is set in the context
  const cookies = await page.context().cookies()
  const sessionCookie = cookies.find((c) => c.name === AUTH_COOKIE_CONFIG.name)

  if (!sessionCookie) {
    throw new Error(
      `Auth verification failed for persona ${persona}:\n` +
        `Session cookie not found in page context.`
    )
  }

  // Make a direct API request using Playwright's request context
  // This verifies the session exists in the database and is valid
  const apiContext = page.request
  const sessionResponse = await apiContext.get('http://localhost:3000/api/auth/session')

  if (!sessionResponse.ok()) {
    throw new Error(
      `Auth verification failed for persona ${persona}:\n` +
        `Status: ${sessionResponse.status()}\n` +
        `Response: ${await sessionResponse.text()}`
    )
  }

  const sessionData = (await sessionResponse.json()) as {
    user?: { primaryPersona?: string }
  } | null

  if (!sessionData?.user) {
    throw new Error(
      `Auth verification failed for persona ${persona}:\n` +
        `Session endpoint returned no user.\n` +
        `Response: ${JSON.stringify(sessionData)}\n` +
        `This indicates the cookie was not recognized by NextAuth.`
    )
  }

  // Verify we got the expected persona
  if (sessionData.user.primaryPersona !== persona) {
    throw new Error(
      `Auth verification mismatch for persona ${persona}:\n` +
        `Expected persona: ${persona}\n` +
        `Got persona: ${String(sessionData.user.primaryPersona)}`
    )
  }
}

/**
 * Set authentication cookie in Playwright page context
 * Includes warmup verification to ensure session is working
 *
 * @param page - Playwright page object
 * @param persona - The user persona to authenticate as
 * @param options.skipVerification - Skip the warmup verification (not recommended)
 *
 * @example
 * ```typescript
 * test('DPO can access team settings', async ({ page }) => {
 *   await setAuthCookie(page, 'DPO')
 *   await page.goto('/settings/team')
 *   await expect(page.getByRole('heading', { name: 'Team Settings' })).toBeVisible()
 * })
 * ```
 */
export async function setAuthCookie(
  page: Page,
  persona: UserPersona,
  options: { skipVerification?: boolean } = {}
): Promise<void> {
  const { token } = await createDevSession(persona)

  // Set cookie with config matching NextAuth exactly (imported from auth config)
  await page.context().addCookies([
    {
      name: AUTH_COOKIE_CONFIG.name,
      value: token,
      domain: 'localhost',
      path: AUTH_COOKIE_CONFIG.options.path,
      httpOnly: AUTH_COOKIE_CONFIG.options.httpOnly,
      sameSite: 'Lax', // Matches AUTH_COOKIE_CONFIG.options.sameSite
      secure: AUTH_COOKIE_CONFIG.options.secure,
      expires: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    },
  ])

  // Warmup request to verify session works end-to-end
  if (!options.skipVerification) {
    await verifyAuthentication(page, persona)
  }
}

/**
 * Clear authentication cookie for a page
 * Call this in afterEach for tests that modify auth state
 */
export async function clearAuthCookie(page: Page): Promise<void> {
  await page.context().clearCookies({
    name: AUTH_COOKIE_CONFIG.name,
  })
}

/**
 * Get the current session token from page cookies
 * Useful for debugging auth issues
 */
export async function getSessionToken(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies()
  const sessionCookie = cookies.find((c) => c.name === AUTH_COOKIE_CONFIG.name)
  return sessionCookie?.value ?? null
}

/**
 * Create authenticated page context for a specific persona
 * Useful for tests that need multiple authenticated users
 *
 * @param context - Playwright browser context
 * @param persona - The user persona to authenticate as
 * @returns New page with authentication cookie set
 */
export async function createAuthenticatedPage(
  context: BrowserContext,
  persona: UserPersona
): Promise<Page> {
  const page = await context.newPage()
  await setAuthCookie(page, persona)
  return page
}

/**
 * Available development personas
 */
export const DEV_PERSONAS = {
  DPO: 'DPO' as UserPersona,
  PRIVACY_OFFICER: 'PRIVACY_OFFICER' as UserPersona,
  BUSINESS_OWNER: 'BUSINESS_OWNER' as UserPersona,
  IT_ADMIN: 'IT_ADMIN' as UserPersona,
  SECURITY_TEAM: 'SECURITY_TEAM' as UserPersona,
  LEGAL_TEAM: 'LEGAL_TEAM' as UserPersona,
}
