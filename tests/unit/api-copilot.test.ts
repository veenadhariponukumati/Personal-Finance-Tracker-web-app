import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Mock } from "vitest"

// Mock auth early
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

// Mock rate limiter
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}))

// Mock copilot
vi.mock("@/ai/copilot", () => ({
  handleChatQuestion: vi.fn(),
  handleInsightRequest: vi.fn(),
}))

import { auth } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { handleChatQuestion, handleInsightRequest } from "@/ai/copilot"
import { POST } from "@/app/api/copilot/ask/route"
import { GET } from "@/app/api/copilot/insights/route"

const mockAuth = auth as Mock
const mockRateLimit = checkRateLimit as Mock
const mockHandleChat = handleChatQuestion as Mock
const mockHandleInsight = handleInsightRequest as Mock

function createRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/copilot/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  // Default: authenticated user, under rate limit
  mockAuth.mockResolvedValue({ user: { id: "user-1" } })
  mockRateLimit.mockReturnValue({ allowed: true })
})

// ─── /api/copilot/ask ─────────────────────────────────────────────

describe("POST /api/copilot/ask", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const response = await POST(createRequest({ message: "test" }))

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toContain("Authentication")
  })

  it("returns 401 when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} })

    const response = await POST(createRequest({ message: "test" }))

    expect(response.status).toBe(401)
  })

  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockReturnValue({ allowed: false, retryAfter: 30 })

    const response = await POST(createRequest({ message: "test" }))

    expect(response.status).toBe(429)
    const body = await response.json()
    expect(body.error).toContain("Too many requests")
    expect(body.retryAfter).toBe(30)
    expect(response.headers.get("Retry-After")).toBe("30")
  })

  it("returns 400 for empty message", async () => {
    const response = await POST(createRequest({ message: "" }))

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.details).toBeDefined()
  })

  it("returns 400 for message over 500 characters", async () => {
    const response = await POST(createRequest({ message: "a".repeat(501) }))

    expect(response.status).toBe(400)
  })

  it("returns 400 for missing message field", async () => {
    const response = await POST(createRequest({}))

    expect(response.status).toBe(400)
  })

  it("returns 400 for invalid JSON", async () => {
    const request = new Request("http://localhost:3000/api/copilot/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it("returns 503 when OPENAI_API_KEY is not set", async () => {
    const originalKey = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY

    const response = await POST(createRequest({ message: "test question" }))

    expect(response.status).toBe(503)

    if (originalKey) process.env.OPENAI_API_KEY = originalKey
  })

  it("returns successful response for valid request", async () => {
    process.env.OPENAI_API_KEY = "sk-test"
    mockHandleChat.mockResolvedValue({
      answer: "You spent $450 on Food last month.",
      confidence: "high",
    })

    const response = await POST(
      createRequest({ message: "How much on food?" })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.answer).toBe("You spent $450 on Food last month.")
    expect(body.confidence).toBe("high")

    // Verify the copilot was called with the correct userId
    expect(mockHandleChat).toHaveBeenCalledWith(
      "user-1",
      "How much on food?",
      "sk-test"
    )
  })

  it("returns fallback response when copilot fails", async () => {
    process.env.OPENAI_API_KEY = "sk-test"
    mockHandleChat.mockResolvedValue({
      answer: "I'm sorry, I couldn't generate a response right now.",
      confidence: null,
    })

    const response = await POST(
      createRequest({ message: "How much on food?" })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.confidence).toBeNull()
  })
})

// ─── /api/copilot/insights ────────────────────────────────────────

describe("GET /api/copilot/insights", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const response = await GET()

    expect(response.status).toBe(401)
  })

  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockReturnValue({ allowed: false, retryAfter: 30 })

    const response = await GET()

    expect(response.status).toBe(429)
  })

  it("returns 503 when OPENAI_API_KEY is not set", async () => {
    const originalKey = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY

    const response = await GET()

    expect(response.status).toBe(503)

    if (originalKey) process.env.OPENAI_API_KEY = originalKey
  })

  it("returns insight on success", async () => {
    process.env.OPENAI_API_KEY = "sk-test"
    mockHandleInsight.mockResolvedValue({
      insight: "You spent 15% more this month.",
      available: true,
    })

    const response = await GET()

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.insight).toBe("You spent 15% more this month.")
    expect(body.available).toBe(true)
  })
})