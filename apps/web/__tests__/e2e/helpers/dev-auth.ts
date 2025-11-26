import { createDevSession, type UserPersona } from '@compilothq/database'
import { type BrowserContext, type Page } from '@playwright/test'

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
 * Set authentication cookie in Playwright page context
 *
 * @param page - Playwright page object
 * @param persona - The user persona to authenticate as
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
export async function setAuthCookie(page: Page, persona: UserPersona): Promise<void> {
  const token = await generateDevSessionToken(persona)

  const cookieName =
    process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token'

  await page.context().addCookies([
    {
      name: cookieName,
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    },
  ])
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
