import { ChatResponseSchema, InsightResponseSchema } from "./types"
import type { ChatResponse, InsightResponse } from "./types"

/**
 * Validates and parses a raw LLM response string as a ChatResponse.
 * Returns the parsed response on success.
 * Throws a ZodError on validation failure.
 */
export function validateChatResponse(raw: string): ChatResponse {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error("Response is not valid JSON")
  }
  return ChatResponseSchema.parse(parsed)
}

/**
 * Validates and parses a raw LLM response string as an InsightResponse.
 * Returns the parsed response on success.
 * Throws a ZodError on validation failure.
 */
export function validateInsightResponse(raw: string): InsightResponse {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error("Response is not valid JSON")
  }
  return InsightResponseSchema.parse(parsed)
}