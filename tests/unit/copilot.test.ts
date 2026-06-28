import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Mock } from "vitest"

// Mock all external dependencies before importing the module under test
vi.mock("@/ai/openai", () => ({
  callLLM: vi.fn(),
}))

vi.mock("@/lib/audit-log", () => ({
  logInteraction: vi.fn(),
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}))

// Mock the analytics engine that context builder depends on
vi.mock("@/services/analytics-engine", () => ({
  getIncomeVsExpenses: vi.fn().mockResolvedValue({
    totalIncome: 5000,
    totalExpenses: 3200,
    balance: 1800,
  }),
  getCategorySpending: vi.fn().mockResolvedValue([
    { name: "Rent", amount: 1200, percentage: 37.5 },
    { name: "Food", amount: 450, percentage: 14.1 },
  ]),
  getSavingsRate: vi.fn().mockResolvedValue({
    savingsRate: 36,
    totalIncome: 5000,
    totalExpenses: 3200,
  }),
  getMonthlyTrend: vi.fn().mockResolvedValue([
    { month: "2026-01", income: 5000, expense: 3000 },
  ]),
}))

import { handleChatQuestion, handleInsightRequest } from "@/ai/copilot"
import { callLLM } from "@/ai/openai"
import { logInteraction } from "@/lib/audit-log"

const mockCallLLM = callLLM as Mock
const mockLogInteraction = logInteraction as Mock

const userId = "user-1"
const apiKey = "sk-test"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("handleChatQuestion", () => {
  it("returns a valid response when OpenAI succeeds", async () => {
    mockCallLLM.mockResolvedValue({
      content: JSON.stringify({
        answer: "You spent $450 on Food last month.",
        confidence: "high",
      }),
      inputTokens: 100,
      outputTokens: 20,
    })

    const result = await handleChatQuestion(
      userId,
      "How much on food?",
      apiKey
    )

    expect(result.answer).toBe("You spent $450 on Food last month.")
    expect(result.confidence).toBe("high")
  })

  it("falls back on OpenAI failure", async () => {
    mockCallLLM.mockRejectedValue(new Error("API unavailable"))

    const result = await handleChatQuestion(userId, "How much on food?", apiKey)

    expect(result.confidence).toBeNull()
    expect(result.answer).toContain("I'm sorry")
  })

  it("retries once on Zod validation failure, then falls back", async () => {
    // First response: invalid JSON
    mockCallLLM.mockResolvedValueOnce({
      content: "not valid json",
      inputTokens: 50,
      outputTokens: 10,
    })
    // Second response: also invalid
    mockCallLLM.mockResolvedValueOnce({
      content: "still not json",
      inputTokens: 50,
      outputTokens: 10,
    })

    const result = await handleChatQuestion(userId, "How much on food?", apiKey)

    expect(result.confidence).toBeNull()
    expect(mockCallLLM).toHaveBeenCalledTimes(2) // retried once
  })

  it("succeeds on retry after first validation failure", async () => {
    mockCallLLM.mockResolvedValueOnce({
      content: "not json",
      inputTokens: 50,
      outputTokens: 10,
    })
    mockCallLLM.mockResolvedValueOnce({
      content: JSON.stringify({
        answer: "You spent $450 on Food.",
        confidence: "high",
      }),
      inputTokens: 100,
      outputTokens: 20,
    })

    const result = await handleChatQuestion(userId, "How much on food?", apiKey)

    expect(result.answer).toBe("You spent $450 on Food.")
    expect(result.confidence).toBe("high")
    expect(mockCallLLM).toHaveBeenCalledTimes(2)
  })

  it("logs an audit entry on success", async () => {
    mockCallLLM.mockResolvedValue({
      content: JSON.stringify({
        answer: "You spent $450.",
        confidence: "high",
      }),
      inputTokens: 100,
      outputTokens: 20,
    })

    await handleChatQuestion(userId, "How much on food?", apiKey)

    expect(mockLogInteraction).toHaveBeenCalledTimes(1)
    const entry = mockLogInteraction.mock.calls[0][0]
    expect(entry.userId).toBe(userId)
    expect(entry.type).toBe("chat")
    expect(entry.valid).toBe(true)
    expect(entry.fallbackUsed).toBe(false)
  })

  it("logs an audit entry on fallback", async () => {
    mockCallLLM.mockRejectedValue(new Error("API error"))

    await handleChatQuestion(userId, "How much on food?", apiKey)

    expect(mockLogInteraction).toHaveBeenCalledTimes(1)
    const entry = mockLogInteraction.mock.calls[0][0]
    expect(entry.valid).toBe(false)
    expect(entry.fallbackUsed).toBe(true)
    expect(entry.errorMessage).toBe("API error")
  })
})

describe("handleInsightRequest", () => {
  it("returns an insight when OpenAI succeeds", async () => {
    mockCallLLM.mockResolvedValue({
      content: JSON.stringify({
        insight: "You spent 15% more this month.",
      }),
      inputTokens: 80,
      outputTokens: 15,
    })

    const result = await handleInsightRequest(userId, apiKey)

    expect(result.insight).toBe("You spent 15% more this month.")
    expect(result.available).toBe(true)
  })

  it("falls back on OpenAI failure", async () => {
    mockCallLLM.mockRejectedValue(new Error("API error"))

    const result = await handleInsightRequest(userId, apiKey)

    expect(result.insight).toBeNull()
    expect(result.available).toBe(false)
  })
})