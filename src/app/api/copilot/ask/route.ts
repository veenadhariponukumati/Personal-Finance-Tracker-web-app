import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { handleChatQuestion } from "@/ai/copilot"
import { z } from "zod"

// ─── Request Validation ───────────────────────────────────────────

const AskRequestSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .max(500, "Message must be 500 characters or less")
    .transform((s) => s.trim()),
})

// ─── POST /api/copilot/ask ────────────────────────────────────────

export async function POST(request: NextRequest) {
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

    // 3. Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      )
    }

    const parsed = AskRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 }
      )
    }

    // 4. Load API key from environment
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OPENAI_API_KEY not configured")
      return NextResponse.json(
        {
          answer:
            "AI features are not configured. Please set the OPENAI_API_KEY environment variable.",
          confidence: null,
        },
        { status: 503 }
      )
    }

    // 5. Process the question
    const result = await handleChatQuestion(userId, parsed.data.message, apiKey)

    return NextResponse.json(result)
  } catch (err) {
    // Safety catch — never leak internal errors to the client
    console.error("Unexpected error in /api/copilot/ask:", err)
    return NextResponse.json(
      {
        answer:
          "An unexpected error occurred. Please try again later.",
        confidence: null,
      },
      { status: 500 }
    )
  }
}