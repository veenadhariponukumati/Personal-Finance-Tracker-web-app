import { test, expect } from "@playwright/test"

test.describe("AI Dashboard Components", () => {
  const testEmail = `ai-test-${Date.now()}@example.com`
  const testPassword = "password123"

  test.beforeAll(async ({ browser }) => {
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

  test("AI components render in idle state with no auto API calls", async ({
    page,
  }) => {
    // Track all fetch/XHR requests to the copilot API
    const apiCalls: string[] = []
    page.on("request", (request) => {
      if (request.url().includes("/api/copilot/")) {
        apiCalls.push(request.url())
      }
    })

    await page.goto("/dashboard")
    await page.waitForURL(/\/dashboard/)

    // Give page time to settle — wait for the chart to render
    await page.waitForTimeout(1000)

    // Verify AI components are visible in idle state
    await expect(page.locator("text=AI Spending Insights")).toBeVisible({
      timeout: 5000,
    })
    await expect(page.locator("text=Ask Finances")).toBeVisible({
      timeout: 5000,
    })

    // Verify Generate Insight button exists
    await expect(
      page.locator("button:has-text('Generate Insight')")
    ).toBeVisible()

    // Verify the chat input exists
    await expect(
      page.locator('input[aria-label="Ask a question about your finances"]')
    ).toBeVisible()

    // Verify NO automatic AI API calls were made on page load
    expect(apiCalls.length).toBe(0)
  })

  test("Generate Insight button triggers API call and shows result", async ({
    page,
  }) => {
    // Mock the insights API response
    await page.route("**/api/copilot/insights", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          insight:
            "You spent 20% more on dining this month compared to last month.",
          available: true,
        }),
      })
    })

    await page.goto("/dashboard")
    await page.waitForURL(/\/dashboard/)

    // Click generate insight
    await page.click("button:has-text('Generate Insight')")

    // Should show the insight text
    await expect(
      page.locator(
        "text=You spent 20% more on dining this month compared to last month."
      )
    ).toBeVisible({ timeout: 5000 })

    // Should show "Generate another insight" link
    await expect(
      page.locator("text=Generate another insight")
    ).toBeVisible()
  })

  test("Ask Finances sends question and shows AI response", async ({
    page,
  }) => {
    // Mock the ask API response
    await page.route("**/api/copilot/ask", async (route) => {
      const requestBody = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          answer: `You spent $450 on Food last month${
            requestBody?.message ? "." : ""
          }`,
          confidence: "high",
        }),
      })
    })

    await page.goto("/dashboard")
    await page.waitForURL(/\/dashboard/)

    // Type a question
    const input = page.locator(
      'input[aria-label="Ask a question about your finances"]'
    )
    await input.fill("How much did I spend on food?")

    // Click Ask
    await page.click("button:has-text('Ask')")

    // Should show user message
    await expect(
      page.locator("text=How much did I spend on food?")
    ).toBeVisible({ timeout: 5000 })

    // Should show AI response
    await expect(
      page.locator("text=You spent $450 on Food last month.")
    ).toBeVisible({ timeout: 5000 })
  })

  test("Ask Finances shows validation error for empty input", async ({
    page,
  }) => {
    await page.goto("/dashboard")
    await page.waitForURL(/\/dashboard/)

    // Click Ask without typing anything
    await page.click("button:has-text('Ask')")

    // Should show validation error
    await expect(page.locator("text=Please enter a question.")).toBeVisible({
      timeout: 5000,
    })
  })
})