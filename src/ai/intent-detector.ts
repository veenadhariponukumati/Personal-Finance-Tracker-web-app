import type { IntentResult, Intent } from "./types"

// ─── Category Keywords ────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string> = {
  food: "Food",
  groceries: "Food",
  dining: "Food",
  restaurant: "Food",
  eat: "Food",
  rent: "Rent",
  housing: "Rent",
  transport: "Transport",
  transportation: "Transport",
  gas: "Transport",
  fuel: "Transport",
  uber: "Transport",
  travel: "Transport",
  shopping: "Shopping",
  clothes: "Shopping",
  apparel: "Shopping",
  entertainment: "Entertainment",
  movies: "Entertainment",
  games: "Entertainment",
  concert: "Entertainment",
  streaming: "Entertainment",
  bills: "Bills",
  utilities: "Bills",
  electricity: "Bills",
  water: "Bills",
  internet: "Bills",
  phone: "Bills",
  salary: "Salary",
  income: "Salary",
  paycheck: "Salary",
}

// ─── Merchant Keywords ────────────────────────────────────────────

const MERCHANT_KEYWORDS = [
  "amazon",
  "netflix",
  "spotify",
  "uber",
  "lyft",
  "doordash",
  "ubereats",
  "starbucks",
  "walmart",
  "target",
  "costco",
  "whole foods",
  "trader joe",
  "apple",
  "google",
  "microsoft",
]

/**
 * Detects the user's intent from their natural language query.
 * Uses keyword matching only — no LLM call.
 *
 * Priority order:
 * 1. category_query — "how much did I spend on food"
 * 2. comparison — "compare with last month"
 * 3. budget — "am I over budget"
 * 4. recurring — "what subscriptions"
 * 5. merchant — "how much on amazon"
 * 6. trend — "spending trend"
 * 7. general — fallback
 */
export function detectIntent(message: string): IntentResult {
  const lower = message.toLowerCase().trim()

  if (!lower) {
    return { intent: "general" }
  }

  // 1. Comparison
  if (
    /\b(compare|vs|versus|than last|difference|change from)\b/.test(lower)
  ) {
    return { intent: "comparison" }
  }

  // 2. Budget
  if (
    /\b(budget|over budget|under budget|overspend|underspend|limit)\b/.test(
      lower
    )
  ) {
    return { intent: "budget" }
  }

  // 3. Recurring / subscriptions
  if (
    /\b(recurring|subscription|subscriptions|monthly charge|membership|automatic)\b/.test(
      lower
    )
  ) {
    return { intent: "recurring" }
  }

  // 4. Trend
  if (
    /\b(trend|pattern|over time|changing|change over)\b/.test(lower)
  ) {
    return { intent: "trend" }
  }

  // 5. Merchant
  for (const merchant of MERCHANT_KEYWORDS) {
    if (lower.includes(merchant)) {
      return { intent: "merchant" }
    }
  }

  // 7. Category query — "how much on food", "spent on groceries"
  // Must come before the "why/how" fallback
  const categoryMatch = lower.match(
    /(?:spend|spent)\s+(?:on|for)\s+(\w+)/
  )
  if (categoryMatch) {
    const word = categoryMatch[1].toLowerCase()
    if (CATEGORY_KEYWORDS[word]) {
      return {
        intent: "category_query",
        params: { categoryName: CATEGORY_KEYWORDS[word] },
      }
    }
  }

  // 8. "why" / "how" + spending → comparison or general
  if (/\b(why|how)\b/.test(lower) && /\b(spend|spent|more|less)\b/.test(lower)) {
    return { intent: "comparison" }
  }

  // 9. General fallback
  return { intent: "general" }
}