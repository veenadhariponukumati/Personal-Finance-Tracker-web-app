import { test, expect } from "@playwright/test"

test.describe("Transaction CRUD", () => {
  const testEmail = `crud-test-${Date.now()}@example.com`
  const testPassword = "password123"

  test.beforeAll(async ({ browser }) => {
    // Register a user for transaction tests
    const page = await browser.newPage()
    await page.goto("/register")
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/login/, { timeout: 10000 })
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
  })

  test("user can create an income transaction", async ({ page }) => {
    await page.goto("/transactions/new")
    await page.fill('input[name="amount"]', "5000")
    await page.selectOption('select[name="type"]', "INCOME")
    await page.selectOption('select[name="categoryId"]', { index: 1 })
    await page.fill('input[name="description"]', "Monthly salary")
    await page.click('button[type="submit"]')
    // Should redirect back to transactions list
    await page.waitForURL(/\/transactions/, { timeout: 10000 })
    // Transaction should appear in the list
    await expect(page.locator("text=Monthly salary")).toBeVisible({ timeout: 5000 })
  })

  test("transaction appears in the transaction list", async ({ page }) => {
    await page.goto("/transactions")
    await expect(page.locator("text=Monthly salary")).toBeVisible({ timeout: 5000 })
  })

  test("dashboard totals update correctly", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.locator("text=5000")).toBeVisible({ timeout: 5000 })
  })
})