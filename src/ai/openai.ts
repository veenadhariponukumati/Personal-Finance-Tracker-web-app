/**
 * Thin wrapper around OpenAI's gpt-4o-mini.
 *
 * This is intentionally not abstracted behind a provider interface.
 * If a different provider is needed later, refactor this one file.
 */

const OPENAI_MODEL = "gpt-4o-mini"
const MAX_TOKENS = 300
const TIMEOUT_MS = 10_000
const TEMPERATURE = 0.1

export interface LLMResult {
  content: string
  inputTokens: number
  outputTokens: number
}

/**
 * Calls OpenAI's chat completions endpoint with a system prompt and
 * user content. Returns the response content and token counts.
 *
 * Times out after TIMEOUT_MS milliseconds.
 * Throws on network error, timeout, or API error.
 */
export async function callLLM(
  systemPrompt: string,
  userContent: string,
  apiKey: string
): Promise<LLMResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE,
        }),
        signal: controller.signal,
      }
    )

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "unknown")
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText} — ${errorBody}`
      )
    }

    const data = (await response.json()) as {
      usage?: { prompt_tokens: number; completion_tokens: number }
      choices: { message: { content: string | null } }[]
    }

    const content = data.choices?.[0]?.message?.content || ""

    return {
      content,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    }
  } finally {
    clearTimeout(timeout)
  }
}