import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { handleInsightRequest } from "@/ai/copilot"

// ─── GET /api/copilot/insights ────────────────────────────────────

export async function GET() {
  try {
    // 1. Authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // 2. Rate limiting (5 req/min per user)
    const rateCheck = checkRateLimit(userId, 5, 60_000)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many requests. Please wait ${rateCheck.retryAfter} seconds before trying again.`,
          retryAfter: rateCheck.retryAfter,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfter) },
        }
      )
    }

    // 3. Load API key from environment
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OPENAI_API_KEY not configured")
      return NextResponse.json(
        { insight: null, available: false },
        { status: 503 }
      )
    }

    // 4. Generate insight
    const result = await handleInsightRequest(userId, apiKey)

    return NextResponse.json(result)
  } catch (err) {
    // Safety catch — never leak internal errors to the client
    console.error("Unexpected error in /api/copilot/insights:", err)
    return NextResponse.json(
      { insight: null, available: false },
      { status: 500 }
    )
  }
}