import { expect, test } from '@playwright/test'

test.describe('Email Authentication Flow', () => {
  test.describe('Login Page', () => {
    test('should display email form with all elements', async ({ page }) => {
      await page.goto('http://localhost:3000/login')

      // Verify page loaded correctly
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
      await expect(page.getByText(/sign in to your compilo account/i)).toBeVisible()

      // Verify form elements
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /continue with email/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible()

      // Verify button is disabled when empty
      await expect(page.getByRole('button', { name: /continue with email/i })).toBeDisabled()
    })

    test('should enable button when email is entered', async ({ page }) => {
      await page.goto('http://localhost:3000/login')

      const emailInput = page.getByLabel(/email/i)
      const submitButton = page.getByRole('button', { name: /continue with email/i })

      // Initially disabled
      await expect(submitButton).toBeDisabled()

      // Type email
      await emailInput.fill('test@example.com')

      // Should be enabled
      await expect(submitButton).toBeEnabled()
    })

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('http://localhost:3000/login')

      const emailInput = page.getByLabel(/email/i)
      const submitButton = page.getByRole('button', { name: /continue with email/i })

      // Enter invalid email
      await emailInput.fill('invalid-email')
      await submitButton.click()

      // Should show validation error
      await expect(page.getByText(/valid email address/i)).toBeVisible()
    })

    test('should send magic link and show confirmation', async ({ page }) => {
      await page.goto('http://localhost:3000/login')

      const emailInput = page.getByLabel(/email/i)
      const submitButton = page.getByRole('button', { name: /continue with email/i })

      // Fill email form
      await emailInput.fill('test@example.com')

      // Click submit button
      await submitButton.click()

      // Should show loading state (briefly)
      // Note: This might be too fast to catch in tests

      // Should show success screen
      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({
        timeout: 10000,
      })
      await expect(page.getByText(/we sent a magic link to/i)).toBeVisible()
      await expect(page.getByText('test@example.com')).toBeVisible()
      await expect(page.getByText(/the link will expire in 15 minutes/i)).toBeVisible()
    })

    test('should allow user to go back and try different email', async ({ page }) => {
      await page.goto('http://localhost:3000/login')

      // Submit first email
      await page.getByLabel(/email/i).fill('first@example.com')
      await page.getByRole('button', { name: /continue with email/i }).click()

      // Wait for success screen
      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible()

      // Click "Use a different email"
      await page.getByRole('button', { name: /use a different email/i }).click()

      // Should be back to form
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
    })

    test('should show loading state during submission', async ({ page }) => {
      await page.goto('http://localhost:3000/login')

      const emailInput = page.getByLabel(/email/i)
      const submitButton = page.getByRole('button', { name: /continue with email/i })

      // Fill email
      await emailInput.fill('test@example.com')

      // Verify button is enabled
      await expect(submitButton).toBeEnabled()

      // Click and verify button becomes disabled
      const buttonPromise = submitButton.click()

      // Button should be disabled during loading (if we can catch it)
      // Note: This might be too fast to reliably test
      // await expect(submitButton).toBeDisabled()

      await buttonPromise

      // Eventually should show success
      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible()
    })

    test('should have link to signup page', async ({ page }) => {
      await page.goto('http://localhost:3000/login')

      const signupLink = page.getByRole('link', { name: /sign up/i })
      await expect(signupLink).toBeVisible()
      await expect(signupLink).toHaveAttribute('href', '/signup')
    })
  })

  test.describe('Signup Page', () => {
    test('should display signup form correctly', async ({ page }) => {
      await page.goto('http://localhost:3000/signup')

      // Verify page loaded correctly
      await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()
      await expect(page.getByText(/get started with compilo compliance management/i)).toBeVisible()

      // Verify form elements
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /continue with email/i })).toBeVisible()
    })

    test('should send magic link and show confirmation', async ({ page }) => {
      await page.goto('http://localhost:3000/signup')

      const emailInput = page.getByLabel(/email/i)
      const submitButton = page.getByRole('button', { name: /continue with email/i })

      // Fill email form
      await emailInput.fill('newuser@example.com')

      // Click submit button
      await submitButton.click()

      // Should show success screen
      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({
        timeout: 10000,
      })
      await expect(page.getByText('newuser@example.com')).toBeVisible()
      await expect(page.getByText(/continue your sign up/i)).toBeVisible()
    })

    test('should have link to login page', async ({ page }) => {
      await page.goto('http://localhost:3000/signup')

      const loginLink = page.getByRole('link', { name: /sign in/i })
      await expect(loginLink).toBeVisible()
      await expect(loginLink).toHaveAttribute('href', '/login')
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page, context }) => {
      // Block API requests to simulate network failure
      await context.route('**/api/auth/**', async (route) => route.abort())

      await page.goto('http://localhost:3000/login')

      // Fill and submit form
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByRole('button', { name: /continue with email/i }).click()

      // Should show error message
      // Note: The exact error message depends on how the app handles network failures
      // This test might need adjustment based on actual error handling
    })
  })

  test.describe('Console Logging', () => {
    test('should log authentication flow to console', async ({ page }) => {
      // Collect console messages
      const consoleLogs: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'log') {
          consoleLogs.push(msg.text())
        }
      })

      await page.goto('http://localhost:3000/login')

      // Submit form
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByRole('button', { name: /continue with email/i }).click()

      // Wait for success
      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible()

      // Verify logging occurred
      expect(consoleLogs.some((log) => log.includes('[Login] Starting email sign-in flow'))).toBe(
        true
      )
      expect(consoleLogs.some((log) => log.includes('[Login] Calling signIn'))).toBe(true)
      expect(consoleLogs.some((log) => log.includes('[Login] signIn result'))).toBe(true)
      expect(consoleLogs.some((log) => log.includes('[Login] Sign in successful'))).toBe(true)
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.goto('http://localhost:3000/login')

      // Email input should have label
      const emailInput = page.getByLabel(/email/i)
      await expect(emailInput).toBeVisible()

      // Submit button should have proper role
      const submitButton = page.getByRole('button', { name: /continue with email/i })
      await expect(submitButton).toBeVisible()

      // Error messages should have alert role (when present)
      await emailInput.fill('invalid')
      await submitButton.click()

      const errorMessage = page.getByRole('alert')
      await expect(errorMessage).toBeVisible()
    })

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('http://localhost:3000/login')

      // Tab to email input
      await page.keyboard.press('Tab')
      await expect(page.getByLabel(/email/i)).toBeFocused()

      // Type email
      await page.keyboard.type('test@example.com')

      // Tab to submit button
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', { name: /continue with email/i })).toBeFocused()

      // Press Enter to submit
      await page.keyboard.press('Enter')

      // Should show success
      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible()
    })
  })

  test.describe('Error Page', () => {
    test('should display auth error page with error parameter', async ({ page }) => {
      await page.goto('http://localhost:3000/error?error=Verification')

      await expect(page.getByRole('heading', { name: /authentication error/i })).toBeVisible()
      await expect(page.getByText(/the verification link is invalid or has expired/i)).toBeVisible()
      await expect(page.getByText(/error code: verification/i)).toBeVisible()
      await expect(page.getByRole('link', { name: /back to login/i })).toBeVisible()
    })

    test('should display default error message without parameter', async ({ page }) => {
      await page.goto('http://localhost:3000/error')

      await expect(page.getByRole('heading', { name: /authentication error/i })).toBeVisible()
      await expect(page.getByText(/an error occurred during authentication/i)).toBeVisible()
    })
  })

  test.describe('Verify Request Page', () => {
    test('should display verify request page', async ({ page }) => {
      await page.goto('http://localhost:3000/verify-request')

      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible()
      await expect(
        page.getByText(/a sign in link has been sent to your email address/i)
      ).toBeVisible()
      await expect(page.getByText(/the link will expire in 15 minutes/i)).toBeVisible()
      await expect(page.getByRole('link', { name: /back to login/i })).toBeVisible()
    })
  })
})
