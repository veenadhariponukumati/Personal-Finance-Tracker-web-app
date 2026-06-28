import prisma from "@/lib/prisma"

// ─── Shared Types ──────────────────────────────────────────────────

export interface CategoryBreakdown {
  name: string
  amount: number
  percentage: number
}

export interface MonthlyPoint {
  month: string // "2026-01"
  income: number
  expense: number
}

export interface MerchantSummary {
  merchant: string
  total: number
  count: number
}

export interface SavingsRateResult {
  savingsRate: number
  totalIncome: number
  totalExpenses: number
}

export interface IncomeVsExpensesResult {
  totalIncome: number
  totalExpenses: number
  balance: number
}

export interface SpendingDelta {
  categoryName: string
  currentAmount: number
  previousAmount: number
  delta: number
}

export interface SpendingDeltasResult {
  currentTotal: number
  previousTotal: number
  totalDelta: number
  categories: SpendingDelta[]
}

// ─── Helpers ───────────────────────────────────────────────────────

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month - 1, 1)
}

function endOfMonth(year: number, month: number): Date {
  return new Date(year, month, 0, 23, 59, 59, 999)
}

function asNumber(value: { toString: () => string } | number | null | undefined): number {
  if (value == null) return 0
  if (typeof value === "number") return value
  return parseFloat(value.toString())
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`
}

// ─── Analytics Functions ──────────────────────────────────────────

/**
 * Returns spending broken down by category for a given month/year.
 * Only EXPENSE transactions are included. Returns categories sorted
 * by amount descending. Each entry includes the percentage of total
 * expenses that category represents.
 */
export async function getCategorySpending(
  userId: string,
  month: number,
  year: number
): Promise<CategoryBreakdown[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      date: {
        gte: startOfMonth(year, month),
        lte: endOfMonth(year, month),
      },
    },
    include: { category: true },
  })

  const grouped = new Map<string, number>()

  for (const t of transactions) {
    const amount = asNumber(t.amount)
    grouped.set(t.category.name, (grouped.get(t.category.name) || 0) + amount)
  }

  const total = Array.from(grouped.values()).reduce((sum, v) => sum + v, 0)

  const result: CategoryBreakdown[] = Array.from(grouped.entries())
    .map(([name, amount]) => ({
      name,
      amount: Math.round(amount * 100) / 100,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  return result
}

/**
 * Returns monthly income/expense totals for the last N months (including
 * the current partial month). Ordered chronologically.
 */
export async function getMonthlyTrend(
  userId: string,
  months: number = 6
): Promise<MonthlyPoint[]> {
  const now = new Date()
  const startYear = now.getFullYear()
  const startMonth = now.getMonth() + 1

  const results: MonthlyPoint[] = []

  for (let i = months - 1; i >= 0; i--) {
    let m = startMonth - i
    let y = startYear
    while (m < 1) {
      m += 12
      y--
    }
    while (m > 12) {
      m -= 12
      y++
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth(y, m),
          lte: endOfMonth(y, m),
        },
      },
    })

    let income = 0
    let expense = 0

    for (const t of transactions) {
      const amount = asNumber(t.amount)
      if (t.type === "INCOME") income += amount
      else expense += amount
    }

    results.push({
      month: monthKey(y, m),
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
    })
  }

  return results
}

/**
 * Returns the top N merchants by total spending (description-based grouping)
 * for a given month/year. A "merchant" is approximated by the transaction
 * description field. Returns sorted by total descending.
 */
export async function getTopMerchants(
  userId: string,
  month: number,
  year: number,
  limit: number = 5
): Promise<MerchantSummary[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      date: {
        gte: startOfMonth(year, month),
        lte: endOfMonth(year, month),
      },
      description: { not: null },
    },
  })

  const grouped = new Map<string, { total: number; count: number }>()

  for (const t of transactions) {
    const merchant = (t.description || "Unknown").trim().toLowerCase()
    const amount = asNumber(t.amount)
    const existing = grouped.get(merchant) || { total: 0, count: 0 }
    existing.total += amount
    existing.count++
    grouped.set(merchant, existing)
  }

  const result: MerchantSummary[] = Array.from(grouped.entries())
    .map(([merchant, data]) => ({
      merchant,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)

  return result
}

/**
 * Computes the savings rate for a given month/year:
 *   savingsRate = (totalIncome - totalExpenses) / totalIncome * 100
 * Returns 0 if totalIncome is 0.
 */
export async function getSavingsRate(
  userId: string,
  month: number,
  year: number
): Promise<SavingsRateResult> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startOfMonth(year, month),
        lte: endOfMonth(year, month),
      },
    },
  })

  let totalIncome = 0
  let totalExpenses = 0

  for (const t of transactions) {
    const amount = asNumber(t.amount)
    if (t.type === "INCOME") totalIncome += amount
    else totalExpenses += amount
  }

  const savingsRate =
    totalIncome > 0
      ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100 * 100) / 100
      : 0

  return {
    savingsRate,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
  }
}

/**
 * Returns total income, total expenses, and balance for a given month/year.
 */
export async function getIncomeVsExpenses(
  userId: string,
  month: number,
  year: number
): Promise<IncomeVsExpensesResult> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startOfMonth(year, month),
        lte: endOfMonth(year, month),
      },
    },
  })

  let totalIncome = 0
  let totalExpenses = 0

  for (const t of transactions) {
    const amount = asNumber(t.amount)
    if (t.type === "INCOME") totalIncome += amount
    else totalExpenses += amount
  }

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    balance: Math.round((totalIncome - totalExpenses) * 100) / 100,
  }
}

/**
 * Compares spending between two months and returns deltas per category
 * and overall. Only EXPENSE transactions are compared.
 */
export async function getSpendingDeltas(
  userId: string,
  currentMonth: number,
  currentYear: number,
  compareMonth: number,
  compareYear: number
): Promise<SpendingDeltasResult> {
  const current = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      date: {
        gte: startOfMonth(currentYear, currentMonth),
        lte: endOfMonth(currentYear, currentMonth),
      },
    },
    include: { category: true },
  })

  const previous = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      date: {
        gte: startOfMonth(compareYear, compareMonth),
        lte: endOfMonth(compareYear, compareMonth),
      },
    },
    include: { category: true },
  })

  const currentByCategory = new Map<string, number>()
  for (const t of current) {
    const amount = asNumber(t.amount)
    currentByCategory.set(
      t.category.name,
      (currentByCategory.get(t.category.name) || 0) + amount
    )
  }

  const previousByCategory = new Map<string, number>()
  for (const t of previous) {
    const amount = asNumber(t.amount)
    previousByCategory.set(
      t.category.name,
      (previousByCategory.get(t.category.name) || 0) + amount
    )
  }

  const allCategories = new Set([
    ...currentByCategory.keys(),
    ...previousByCategory.keys(),
  ])

  const categories: SpendingDelta[] = Array.from(allCategories)
    .map((name) => {
      const currentAmount = currentByCategory.get(name) || 0
      const previousAmount = previousByCategory.get(name) || 0
      return {
        categoryName: name,
        currentAmount: Math.round(currentAmount * 100) / 100,
        previousAmount: Math.round(previousAmount * 100) / 100,
        delta: Math.round((currentAmount - previousAmount) * 100) / 100,
      }
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  const currentTotal = categories.reduce((s, c) => s + c.currentAmount, 0)
  const previousTotal = categories.reduce((s, c) => s + c.previousAmount, 0)

  return {
    currentTotal: Math.round(currentTotal * 100) / 100,
    previousTotal: Math.round(previousTotal * 100) / 100,
    totalDelta: Math.round((currentTotal - previousTotal) * 100) / 100,
    categories,
  }
}