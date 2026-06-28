import {
  getCategorySpending,
  getIncomeVsExpenses,
  getSavingsRate,
  getMonthlyTrend,
} from "@/services/analytics-engine"
import type { FinancialContext } from "./types"

/**
 * Builds a FinancialContext object from the analytics engine.
 *
 * This is the ONLY way the AI layer gets data. It receives only
 * aggregated metrics — no raw transactions, no descriptions, no PII.
 *
 * All numbers are pre-computed by the analytics engine. The AI
 * never touches Prisma, never runs SQL, and never calculates.
 */
export async function buildChatContext(
  userId: string
): Promise<FinancialContext> {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Previous month (handle January → December of previous year)
  let prevMonth = currentMonth - 1
  let prevYear = currentYear
  if (prevMonth < 1) {
    prevMonth = 12
    prevYear = currentYear - 1
  }

  const [currentSummary, currentCategories, previousCategories, savings, trend] =
    await Promise.all([
      getIncomeVsExpenses(userId, currentMonth, currentYear),
      getCategorySpending(userId, currentMonth, currentYear),
      getCategorySpending(userId, prevMonth, prevYear),
      getSavingsRate(userId, currentMonth, currentYear),
      getMonthlyTrend(userId, 6),
    ])

  return {
    currentMonth: {
      totalIncome: currentSummary.totalIncome,
      totalExpenses: currentSummary.totalExpenses,
      balance: currentSummary.balance,
      categories: currentCategories,
    },
    previousMonth: {
      totalExpenses: previousCategories.reduce((s, c) => s + c.amount, 0),
      categories: previousCategories,
    },
    savingsRate: savings.savingsRate,
    monthlyTrend: trend,
  }
}