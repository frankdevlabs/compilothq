import { expect, test } from '@playwright/test'

test.describe('Marketing Pages - E2E Tests', () => {
  test.describe('Homepage', () => {
    test('should load homepage and display main content', async ({ page }) => {
      // Navigate to homepage
      await page.goto('/')

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Assert: Page heading is visible
      const heading = page.getByRole('heading', { level: 1 })
      await expect(heading).toBeVisible()
      await expect(heading).toContainText('To get started')

      // Assert: Links are present
      await expect(page.getByRole('link', { name: /deploy now/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /documentation/i })).toBeVisible()
    })

    test('should have Next.js logo', async ({ page }) => {
      // Navigate to homepage
      await page.goto('/')

      // Assert: Logo image is visible
      const logo = page.getByAltText('Next.js logo')
      await expect(logo).toBeVisible()
    })

    test('should have external links with correct attributes', async ({ page }) => {
      // Navigate to homepage
      await page.goto('/')

      // Assert: External links have target="_blank" and rel="noopener noreferrer"
      const deployLink = page.getByRole('link', { name: /deploy now/i })
      await expect(deployLink).toHaveAttribute('target', '_blank')
      await expect(deployLink).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  test.describe('Navigation', () => {
    test('should load page successfully', async ({ page }) => {
      // Navigate to homepage
      await page.goto('/')

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Assert: Page loaded successfully
      expect(page.url()).toMatch(/\/$/)
      await expect(page.getByRole('main')).toBeVisible()
    })
  })

  test.describe('Responsive Behavior', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      // Navigate to homepage
      await page.goto('/')

      // Assert: Main content is visible on mobile
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('main')).toBeVisible()
    })

    test('should display correctly on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })

      // Navigate to homepage
      await page.goto('/')

      // Assert: Content is visible on tablet
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('main')).toBeVisible()
    })

    test('should display correctly on desktop viewport', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })

      // Navigate to homepage
      await page.goto('/')

      // Assert: Content is visible on desktop
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('main')).toBeVisible()
    })
  })

  test.describe('Page Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      // Navigate to homepage
      await page.goto('/')

      // Assert: H1 heading exists
      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1).toBeVisible()
    })

    test('should have accessible images with alt text', async ({ page }) => {
      // Navigate to homepage
      await page.goto('/')

      // Assert: Images have alt text
      const logo = page.getByAltText('Next.js logo')
      await expect(logo).toBeVisible()

      const vercelLogo = page.getByAltText('Vercel logomark')
      await expect(vercelLogo).toBeVisible()
    })

    test('should have accessible links', async ({ page }) => {
      // Navigate to homepage
      await page.goto('/')

      // Assert: Links are accessible by role
      const links = await page.getByRole('link').all()
      expect(links.length).toBeGreaterThan(0)

      // All links should be visible
      for (const link of links) {
        await expect(link).toBeVisible()
      }
    })
  })

  test.describe('Visual Elements', () => {
    test('should display text content correctly', async ({ page }) => {
      // Navigate to homepage
      await page.goto('/')

      // Assert: Description text is present
      await expect(page.getByText(/Looking for a starting point/i)).toBeVisible()
      await expect(page.getByText(/Templates/i).first()).toBeVisible()
      await expect(page.getByText(/Learning/i).first()).toBeVisible()
    })

    test('should have proper layout structure', async ({ page }) => {
      // Navigate to homepage
      await page.goto('/')

      // Assert: Main element exists
      const main = page.getByRole('main')
      await expect(main).toBeVisible()

      // Assert: Has content sections
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('p').first()).toBeVisible()
    })
  })
})
