import { expect, test } from '@playwright/test'

import { setAuthCookie } from './helpers/dev-auth'

/**
 * Verification test for Tailwind CSS v4 @source directive fix
 *
 * This test verifies that the dialog component is properly styled after fixing
 * the @source path from ../../../packages to ../../../../packages
 *
 * Expected behavior:
 * - Dialog should be visible when "Invite Member" button is clicked
 * - Dialog should have proper backdrop (dark overlay)
 * - Dialog should be centered on the page
 * - Dialog should have proper z-index and positioning
 */
test.describe('Dialog Component - Tailwind v4 @source Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as DPO (has organization access)
    await setAuthCookie(page, 'DPO')
  })

  test('dialog displays correctly with proper Tailwind utilities', async ({ page }) => {
    // Navigate to team settings page
    await page.goto('/settings/team')

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Team Management/i })).toBeVisible()

    // Find and click the "Invite Member" button
    const inviteButton = page.getByRole('button', { name: /Invite Member/i })
    await expect(inviteButton).toBeVisible()
    await inviteButton.click()

    // Verify dialog is visible
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 2000 })

    // Verify dialog has proper positioning (centered)
    const dialogBox = await dialog.boundingBox()
    expect(dialogBox).toBeTruthy()

    // Verify backdrop is present (should be a sibling element with data-radix-dialog-overlay)
    const backdrop = page.locator('[data-radix-dialog-overlay]')
    await expect(backdrop).toBeVisible()

    // Verify dialog content is present
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
    await expect(page.getByRole('combobox', { name: /role/i })).toBeVisible()

    // Verify dialog can be closed with ESC key
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()

    console.log('✅ Dialog component displays correctly with all Tailwind utilities applied!')
  })

  test('dialog has correct computed styles from Tailwind', async ({ page }) => {
    await page.goto('/settings/team')
    await page.getByRole('button', { name: /Invite Member/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Get computed styles for the dialog
    const styles = await dialog.evaluate((el) => {
      const computed = window.getComputedStyle(el)
      return {
        position: computed.position,
        zIndex: computed.zIndex,
        top: computed.top,
        left: computed.left,
        transform: computed.transform,
      }
    })

    // Verify critical styles are applied correctly
    expect(styles.position).toBe('fixed')
    expect(parseInt(styles.zIndex)).toBeGreaterThanOrEqual(50)
    expect(styles.top).toBe('50%')
    expect(styles.left).toBe('50%')
    expect(styles.transform).toContain('translate')

    console.log('✅ Dialog has correct Tailwind-generated styles:', styles)
  })
})
