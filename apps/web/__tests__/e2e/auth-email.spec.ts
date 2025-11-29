import { expect, test } from '@playwright/test'

test.describe('Email Authentication Flow', () => {
  test.describe('Login Page', () => {
    test('should display email form with all elements', async ({ page }) => {
      await page.goto('/login')

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
      await page.goto('/login')

      const emailInput = page.getByLabel(/email/i)
      const submitButton = page.getByRole('button', { name: /continue with email/i })

      // Wait for form to be interactive
      await expect(emailInput).toBeVisible()
      await expect(submitButton).toBeDisabled()

      // Fill email - this triggers React state update
      await emailInput.fill('test@example.com')

      // Button should become enabled after state update
      await expect(submitButton).toBeEnabled()
    })

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/login')

      const emailInput = page.getByLabel(/email/i)
      const submitButton = page.getByRole('button', { name: /continue with email/i })

      // Wait for form to be interactive
      await expect(emailInput).toBeVisible()

      // Enter email without @ symbol
      await emailInput.fill('invalid-email')
      await expect(submitButton).toBeEnabled()

      // Remove HTML5 email validation to test React validation
      await emailInput.evaluate((el) => el.removeAttribute('type'))

      // Click submit button - this properly triggers React's form handler
      await submitButton.click()

      // Should show React validation error
      await expect(page.getByText(/valid email address/i)).toBeVisible()
    })

    test('should have link to signup page', async ({ page }) => {
      await page.goto('/login')

      const signupLink = page.getByRole('link', { name: /sign up/i })
      await expect(signupLink).toBeVisible()
      await expect(signupLink).toHaveAttribute('href', '/signup')
    })
  })

  test.describe('Signup Page', () => {
    test('should display signup form correctly', async ({ page }) => {
      await page.goto('/signup')

      // Verify page loaded correctly
      await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()
      await expect(page.getByText(/get started with compilo compliance management/i)).toBeVisible()

      // Verify form elements
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /continue with email/i })).toBeVisible()
    })

    test('should have link to login page', async ({ page }) => {
      await page.goto('/signup')

      const loginLink = page.getByRole('link', { name: /sign in/i })
      await expect(loginLink).toBeVisible()
      await expect(loginLink).toHaveAttribute('href', '/login')
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.goto('/login')

      // Email input should have label association
      const emailInput = page.getByLabel(/email/i)
      await expect(emailInput).toBeVisible()

      // Submit button should have proper role
      const submitButton = page.getByRole('button', { name: /continue with email/i })
      await expect(submitButton).toBeVisible()

      // Test that error messages have alert role when validation fails
      await emailInput.fill('invalid')
      await expect(submitButton).toBeEnabled()

      // Remove HTML5 email validation to trigger React validation
      await emailInput.evaluate((el) => el.removeAttribute('type'))

      // Click submit button to trigger validation
      await submitButton.click()

      // The error message should appear with role="alert" for accessibility
      const errorMessage = page.locator('#email-error')
      await expect(errorMessage).toBeVisible()
      await expect(errorMessage).toHaveAttribute('role', 'alert')
    })
  })

  test.describe('Error Page', () => {
    test('should display auth error page with error parameter', async ({ page }) => {
      await page.goto('/error?error=Verification')

      await expect(page.getByRole('heading', { name: /authentication error/i })).toBeVisible()
      await expect(page.getByText(/the verification link is invalid or has expired/i)).toBeVisible()
      await expect(page.getByText(/error code: verification/i)).toBeVisible()
      await expect(page.getByRole('link', { name: /back to login/i })).toBeVisible()
    })

    test('should display default error message without parameter', async ({ page }) => {
      await page.goto('/error')

      await expect(page.getByRole('heading', { name: /authentication error/i })).toBeVisible()
      await expect(page.getByText(/an error occurred during authentication/i)).toBeVisible()
    })
  })

  test.describe('Verify Request Page', () => {
    test('should display verify request page', async ({ page }) => {
      await page.goto('/verify-request')

      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible()
      await expect(
        page.getByText(/a sign in link has been sent to your email address/i)
      ).toBeVisible()
      await expect(page.getByText(/the link will expire in 15 minutes/i)).toBeVisible()
      await expect(page.getByRole('link', { name: /back to login/i })).toBeVisible()
    })
  })
})
