import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('should display login form', async ({ page }) => {
    await page.goto('/login')
    
    // Check if login form elements are present
    await expect(page.getByText('Welcome Back')).toBeVisible()
    await expect(page.getByText('Sign in to your account')).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should have default credentials filled', async ({ page }) => {
    await page.goto('/login')
    
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)
    
    await expect(emailInput).toHaveValue('admin@example.com')
    await expect(passwordInput).toHaveValue('ChangeMeAdmin123!')
  })

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login')
    
    const passwordInput = page.getByLabel(/password/i)
    const toggleButton = page.getByRole('button', { name: /toggle password visibility/i })
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click toggle to show password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click toggle to hide password again
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should allow editing email and password', async ({ page }) => {
    await page.goto('/login')
    
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)
    
    // Clear and type new email
    await emailInput.clear()
    await emailInput.fill('test@example.com')
    await expect(emailInput).toHaveValue('test@example.com')
    
    // Clear and type new password
    await passwordInput.clear()
    await passwordInput.fill('newpassword123')
    await expect(passwordInput).toHaveValue('newpassword123')
  })

  test('should show loading state during login', async ({ page }) => {
    await page.goto('/login')
    
    const submitButton = page.getByRole('button', { name: /sign in/i })
    
    // Mock a slow API response
    await page.route('**/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4ifQ.signature',
          refreshToken: 'refresh-token'
        })
      })
    })
    
    // Click submit and check loading state
    await submitButton.click()
    await expect(submitButton).toBeDisabled()
    
    // Wait for request to complete
    await expect(submitButton).not.toBeDisabled({ timeout: 2000 })
  })

  test('should handle successful admin login', async ({ page }) => {
    await page.goto('/login')
    
    // Mock successful login response
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4ifQ.signature',
          refreshToken: 'refresh-token'
        })
      })
    })
    
    const submitButton = page.getByRole('button', { name: /sign in/i })
    await submitButton.click()
    
    // Should redirect to users page for admin
    await expect(page).toHaveURL('/users')
    
    // Check if tokens are stored
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'))
    const role = await page.evaluate(() => localStorage.getItem('role'))
    
    expect(accessToken).toBeTruthy()
    expect(role).toBe('admin')
  })

  test('should handle successful sales login', async ({ page }) => {
    await page.goto('/login')
    
    // Mock successful login response for sales user
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2FsZXMifQ.signature',
          refreshToken: 'refresh-token'
        })
      })
    })
    
    const submitButton = page.getByRole('button', { name: /sign in/i })
    await submitButton.click()
    
    // Should redirect to products page for sales
    await expect(page).toHaveURL('/products')
    
    const role = await page.evaluate(() => localStorage.getItem('role'))
    expect(role).toBe('sales')
  })

  test('should handle login error', async ({ page }) => {
    await page.goto('/login')
    
    // Mock failed login response
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Invalid credentials'
        })
      })
    })
    
    const submitButton = page.getByRole('button', { name: /sign in/i })
    await submitButton.click()
    
    // Should show error message
    await expect(page.getByText('Invalid credentials')).toBeVisible()
    
    // Should stay on login page
    await expect(page).toHaveURL('/login')
  })

  test('should handle network error', async ({ page }) => {
    await page.goto('/login')
    
    // Mock network error
    await page.route('**/auth/login', async route => {
      await route.abort('failed')
    })
    
    const submitButton = page.getByRole('button', { name: /sign in/i })
    await submitButton.click()
    
    // Should show network error message
    await expect(page.getByText(/unable to connect to server/i)).toBeVisible()
  })

  test('should submit form with Enter key', async ({ page }) => {
    await page.goto('/login')
    
    // Mock successful login response
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4ifQ.signature',
          refreshToken: 'refresh-token'
        })
      })
    })
    
    const passwordInput = page.getByLabel(/password/i)
    await passwordInput.press('Enter')
    
    // Should redirect after successful login
    await expect(page).toHaveURL('/users')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')
    
    // Check if form is still visible and usable on mobile
    await expect(page.getByText('Welcome Back')).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    
    // Test form interaction on mobile
    const emailInput = page.getByLabel(/email/i)
    await emailInput.clear()
    await emailInput.fill('mobile@test.com')
    await expect(emailInput).toHaveValue('mobile@test.com')
  })

  test('should show success toast on login', async ({ page }) => {
    await page.goto('/login')
    
    // Mock successful login response
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4ifQ.signature',
          refreshToken: 'refresh-token'
        })
      })
    })
    
    const submitButton = page.getByRole('button', { name: /sign in/i })
    await submitButton.click()
    
    // Should show success toast
    await expect(page.getByText(/welcome back/i)).toBeVisible()
  })

  test('should clear error on new submission', async ({ page }) => {
    await page.goto('/login')
    
    // First submission fails
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Invalid credentials'
        })
      })
    })
    
    const submitButton = page.getByRole('button', { name: /sign in/i })
    await submitButton.click()
    
    // Should show error
    await expect(page.getByText('Invalid credentials')).toBeVisible()
    
    // Mock successful response for second attempt
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4ifQ.signature',
          refreshToken: 'refresh-token'
        })
      })
    })
    
    // Second submission should clear error and succeed
    await submitButton.click()
    await expect(page.getByText('Invalid credentials')).not.toBeVisible()
    await expect(page).toHaveURL('/users')
  })
})
