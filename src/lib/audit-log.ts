import prisma from "@/lib/prisma"
import type { AuditLogEntry } from "@/ai/types"

/**
 * Writes an AI interaction to the AiInteraction table.
 * This is intentionally async but non-blocking — the caller
 * does not need to await it for the response to return.
 *
 * If logging fails (e.g. database unavailable), the error is
 * silently caught. The AI response is more important than the log.
 */
export async function logInteraction(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.aiInteraction.create({
      data: {
        userId: entry.userId,
        type: entry.type,
        intent: entry.intent ?? null,
        userMessage: entry.userMessage ?? null,
        aiResponse: entry.aiResponse ?? null,
        inputTokens: entry.inputTokens,
        outputTokens: entry.outputTokens,
        latencyMs: entry.latencyMs,
        valid: entry.valid,
        fallbackUsed: entry.fallbackUsed,
        errorMessage: entry.errorMessage ?? null,
        model: "gpt-4o-mini",
      },
    })
  } catch (err) {
    // Log failure should never break the user experience
    console.error("Failed to log AI interaction:", err)
  }
}