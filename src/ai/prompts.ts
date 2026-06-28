/**
 * Prompt templates for the AI Financial Copilot.
 *
 * These are the only prompts used. Each is a complete string with
 * {{placeholders}} for dynamic content. No prompt assembly from
 * user input — user questions are injected only in the "user" role
 * of the LLM call, not into the system prompt.
 */

/**
 * System prompt for chat-style Q&A.
 * Instructs the AI to use only provided data and never calculate.
 */
export const CHAT_SYSTEM_PROMPT = `You are a financial assistant. Given the user's financial data and their question, provide a clear, concise answer.

Rules:
- Use ONLY the exact numbers provided in the data below.
- Do NOT calculate, sum, subtract, derive, or approximate any numbers.
- If the data doesn't contain the answer, say so with "confidence": "low".
- Do not reference specific merchants, transaction descriptions, or vendor names.
- Keep your answer under 3 sentences.
- Output valid JSON only.`

/**
 * System prompt for passive dashboard insights.
 */
export const INSIGHT_SYSTEM_PROMPT = `You are a financial assistant. Given the user's financial data below, write one or two concise sentences highlighting the most interesting change or pattern.

Rules:
- Use ONLY the exact numbers provided.
- Do NOT calculate or derive new numbers.
- Focus on the biggest change or most notable pattern.
- Do not reference specific merchants or descriptions.
- Output valid JSON only.`

/**
 * Builds the user message for a chat request.
 * The user question goes here — never in the system prompt.
 */
export function buildChatUserMessage(
  question: string,
  data: Record<string, unknown>
): string {
  return [
    `User question: ${question}`,
    ``,
    `Here is the financial data:`,
    JSON.stringify(data, null, 2),
  ].join("\n")
}

/**
 * Builds the user message for an insight request.
 */
export function buildInsightUserMessage(
  data: Record<string, unknown>
): string {
  return [
    `Here is the financial data:`,
    JSON.stringify(data, null, 2),
  ].join("\n")
}