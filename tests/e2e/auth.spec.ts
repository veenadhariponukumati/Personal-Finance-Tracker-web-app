import { test, expect } from "@playwright/test"

test.describe("Auth Flow", () => {
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = "password123"

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/dashboard")
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain("/login")
  })

  test("user can register with email and password", async ({ page }) => {
    await page.goto("/register")
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.click('button[type="submit"]')
    // After registration, should redirect to login
    await page.waitForURL(/\/login/, { timeout: 10000 })
    expect(page.url()).toContain("/login")
  })

  test("user can log in and access dashboard", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.click('button[type="submit"]')
    // After login, should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    expect(page.url()).toContain("/dashboard")
  })
})