import { expect, test } from '@playwright/test'

import { clearAuthCookie, setAuthCookie } from './helpers/dev-auth'

// Configure this describe block to run serially with retries
// Auth redirect tests modify session state and need isolation
test.describe.configure({ mode: 'serial', retries: 2 })

test.describe('Authenticated User Redirects', () => {
  // Clean up after each test to prevent state leakage
  test.afterEach(async ({ page }) => {
    await clearAuthCookie(page)
  })

  test.describe('Auth Routes Redirect', () => {
    test('authenticated user visiting /login is redirected to /dashboard', async ({ page }) => {
      await setAuthCookie(page, 'DPO')

      await page.goto('/login')

      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('authenticated user visiting /signup is redirected to /dashboard', async ({ page }) => {
      await setAuthCookie(page, 'DPO')

      await page.goto('/signup')

      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('authenticated user with callbackUrl is redirected to that URL', async ({ page }) => {
      await setAuthCookie(page, 'DPO')

      await page.goto('/login?callbackUrl=/settings')

      await expect(page).toHaveURL(/\/settings/)
    })

    test('authenticated user with absolute callbackUrl is redirected to /dashboard (security)', async ({
      page,
    }) => {
      await setAuthCookie(page, 'DPO')

      await page.goto('/login?callbackUrl=https://evil.com')

      await expect(page).toHaveURL(/\/dashboard/)
    })
  })

  test.describe('Public Routes Accessible', () => {
    test('authenticated user can access homepage', async ({ page }) => {
      await setAuthCookie(page, 'DPO')

      // Navigate away from / (warmup goes there) to test fresh navigation
      await page.goto('/login')
      await page.goto('/')

      await expect(page).toHaveURL(/\/$/)
    })

    test('authenticated user can access /error page (not redirected)', async ({ page }) => {
      await setAuthCookie(page, 'DPO')

      await page.goto('/error')

      await expect(page).toHaveURL(/\/error/)
    })

    test('authenticated user can access /verify-request page (not redirected)', async ({
      page,
    }) => {
      await setAuthCookie(page, 'DPO')

      await page.goto('/verify-request')

      await expect(page).toHaveURL(/\/verify-request/)
    })
  })

  test.describe('Unauthenticated Access', () => {
    test('unauthenticated user can access /login (not redirected)', async ({ page }) => {
      await page.goto('/login')

      await expect(page).toHaveURL(/\/login$/)
    })

    test('unauthenticated user can access /signup (not redirected)', async ({ page }) => {
      await page.goto('/signup')

      await expect(page).toHaveURL(/\/signup$/)
    })

    test('unauthenticated user visiting /dashboard is redirected to /login', async ({ page }) => {
      await page.goto('/dashboard')

      await expect(page).toHaveURL(/\/login\?callbackUrl=/)
    })
  })
})
