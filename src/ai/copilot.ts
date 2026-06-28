import { detectIntent } from "./intent-detector"
import { buildChatContext } from "./context"
import { callLLM } from "./openai"
import {
  CHAT_SYSTEM_PROMPT,
  INSIGHT_SYSTEM_PROMPT,
  buildChatUserMessage,
  buildInsightUserMessage,
} from "./prompts"
import { validateChatResponse, validateInsightResponse } from "./validate"
import { logInteraction } from "@/lib/audit-log"
import {
  FALLBACK_CHAT_RESPONSE,
  FALLBACK_INSIGHT_RESPONSE,
} from "./types"
import type {
  CopilotResponse,
  InsightAPIResponse,
  AuditLogEntry,
} from "./types"

/**
 * Processes a user's financial question and returns an AI-generated answer.
 *
 * Pipeline:
 * 1. Detect intent (keyword matching, no LLM)
 * 2. Build context from analytics engine (aggregated data only)
 * 3. Call OpenAI gpt-4o-mini with system prompt + data
 * 4. Zod-validate the response
 * 5. Retry once on validation failure
 * 6. Fallback to default message on all failures
 *
 * The AI NEVER:
 * - Touches Prisma directly
 * - Runs SQL queries
 * - Calculates financial values
 * - Receives raw transaction descriptions or merchant names
 */
export async function handleChatQuestion(
  userId: string,
  question: string,
  openAIApiKey: string
): Promise<CopilotResponse> {
  const startTime = Date.now()
  let auditEntry: Partial<AuditLogEntry> = {
    userId,
    type: "chat",
    userMessage: question,
    fallbackUsed: false,
  }

  try {
    // 1. Detect intent
    const { intent } = detectIntent(question)
    auditEntry.intent = intent

    // 2. Build context (aggregated analytics only)
    const context = await buildChatContext(userId)

    // 3. Build prompts
    const userContent = buildChatUserMessage(question, context as unknown as Record<string, unknown>)

    // 4. Call LLM (attempt 1)
    const result1 = await callLLM(CHAT_SYSTEM_PROMPT, userContent, openAIApiKey)
    auditEntry.inputTokens = result1.inputTokens
    auditEntry.outputTokens = result1.outputTokens

    // 5. Validate response
    try {
      const validated = validateChatResponse(result1.content)
      auditEntry.valid = true
      auditEntry.aiResponse = JSON.stringify(validated)

      const elapsed = Date.now() - startTime
      logInteraction(auditEntry as AuditLogEntry)

      return {
        answer: validated.answer,
        confidence: validated.confidence,
      }
    } catch {
      // Validation failed — retry once
      const result2 = await callLLM(
        CHAT_SYSTEM_PROMPT,
        userContent,
        openAIApiKey
      )
      auditEntry.inputTokens += result2.inputTokens
      auditEntry.outputTokens += result2.outputTokens

      try {
        const validated = validateChatResponse(result2.content)
        auditEntry.valid = true
        auditEntry.aiResponse = JSON.stringify(validated)

        const elapsed = Date.now() - startTime
        logInteraction(auditEntry as AuditLogEntry)

        return {
          answer: validated.answer,
          confidence: validated.confidence,
        }
      } catch {
        // Retry also failed — fall through to fallback
        auditEntry.valid = false
        auditEntry.fallbackUsed = true
        auditEntry.errorMessage = "Zod validation failed after retry"
      }
    }
  } catch (err) {
    auditEntry.valid = false
    auditEntry.fallbackUsed = true
    auditEntry.errorMessage =
      err instanceof Error ? err.message : "Unknown error"
  }

  // Fallback: log and return default message
  auditEntry.valid = false
  auditEntry.fallbackUsed = true
  const elapsed = Date.now() - startTime
  auditEntry.latencyMs = elapsed
  logInteraction(auditEntry as AuditLogEntry)

  return FALLBACK_CHAT_RESPONSE
}

/**
 * Generates an on-demand spending insight for the dashboard.
 *
 * Same pipeline as handleChatQuestion but without intent detection
 * (always returns an insight about the current month's data).
 */
export async function handleInsightRequest(
  userId: string,
  openAIApiKey: string
): Promise<InsightAPIResponse> {
  const startTime = Date.now()
  let auditEntry: Partial<AuditLogEntry> = {
    userId,
    type: "insight",
    intent: "insight",
    fallbackUsed: false,
  }

  try {
    // Build context
    const context = await buildChatContext(userId)
    const userContent = buildInsightUserMessage(context as unknown as Record<string, unknown>)

    // Call LLM
    const result = await callLLM(INSIGHT_SYSTEM_PROMPT, userContent, openAIApiKey)
    auditEntry.inputTokens = result.inputTokens
    auditEntry.outputTokens = result.outputTokens

    // Validate
    try {
      const validated = validateInsightResponse(result.content)
      auditEntry.valid = true
      auditEntry.aiResponse = JSON.stringify(validated)

      const elapsed = Date.now() - startTime
      logInteraction(auditEntry as AuditLogEntry)

      return { insight: validated.insight, available: true }
    } catch {
      // Retry once
      const result2 = await callLLM(
        INSIGHT_SYSTEM_PROMPT,
        userContent,
        openAIApiKey
      )
      auditEntry.inputTokens += result2.inputTokens
      auditEntry.outputTokens += result2.outputTokens

      try {
        const validated = validateInsightResponse(result2.content)
        auditEntry.valid = true
        auditEntry.aiResponse = JSON.stringify(validated)

        const elapsed = Date.now() - startTime
        logInteraction(auditEntry as AuditLogEntry)

        return { insight: validated.insight, available: true }
      } catch {
        auditEntry.valid = false
        auditEntry.fallbackUsed = true
        auditEntry.errorMessage = "Zod validation failed after retry"
      }
    }
  } catch (err) {
    auditEntry.valid = false
    auditEntry.fallbackUsed = true
    auditEntry.errorMessage =
      err instanceof Error ? err.message : "Unknown error"
  }

  auditEntry.valid = false
  auditEntry.fallbackUsed = true
  const elapsed = Date.now() - startTime
  auditEntry.latencyMs = elapsed
  logInteraction(auditEntry as AuditLogEntry)

  return FALLBACK_INSIGHT_RESPONSE
}