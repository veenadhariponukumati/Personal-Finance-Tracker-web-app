import { z } from "zod"

// ─── Analytics Data Shapes (what Context Builder returns) ─────────

export interface CategorySummary {
  name: string
  amount: number
  percentage: number
}

export interface MonthlySummary {
  month: string
  income: number
  expense: number
}

export interface FinancialContext {
  currentMonth: {
    totalIncome: number
    totalExpenses: number
    balance: number
    categories: CategorySummary[]
  }
  previousMonth?: {
    totalExpenses: number
    categories: CategorySummary[]
  }
  savingsRate: number
  monthlyTrend: MonthlySummary[]
}

// ─── Intents ──────────────────────────────────────────────────────

export type Intent =
  | "category_query"
  | "comparison"
  | "trend"
  | "budget"
  | "recurring"
  | "merchant"
  | "general"

export interface IntentResult {
  intent: Intent
  params?: {
    categoryName?: string
    timeRange?: string
  }
}

// ─── AI Response Shapes ───────────────────────────────────────────

export const ChatResponseSchema = z.object({
  answer: z.string().min(1).max(500),
  confidence: z.enum(["high", "medium", "low"]),
})

export type ChatResponse = z.infer<typeof ChatResponseSchema>

export const InsightResponseSchema = z.object({
  insight: z.string().min(1).max(300),
})

export type InsightResponse = z.infer<typeof InsightResponseSchema>

// ─── API Response Shapes ──────────────────────────────────────────

export interface CopilotResponse {
  answer: string
  confidence: "high" | "medium" | "low" | null
}

export interface InsightAPIResponse {
  insight: string | null
  available: boolean
}

// ─── Fallback Messages ────────────────────────────────────────────

export const FALLBACK_CHAT_RESPONSE: CopilotResponse = {
  answer:
    "I'm sorry, I couldn't generate a response right now. Your dashboard has the latest numbers.",
  confidence: null,
}

export const FALLBACK_INSIGHT_RESPONSE: InsightAPIResponse = {
  insight: null,
  available: false,
}

// ─── Audit Log ────────────────────────────────────────────────────

export interface AuditLogEntry {
  userId: string
  type: "insight" | "chat"
  intent?: string
  userMessage?: string
  aiResponse?: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  valid: boolean
  fallbackUsed: boolean
  errorMessage?: string
}