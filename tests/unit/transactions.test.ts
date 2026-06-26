import { describe, it, expect } from "vitest"

/**
 * Format an amount as a currency string
 */
function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

/**
 * Filter transactions by a specific month and year
 */
function filterByMonth<T extends { date: Date }>(
  transactions: T[],
  month: number,
  year: number
): T[] {
  return transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getMonth() === month && d.getFullYear() === year
  })
}

/**
 * Filter transactions by category
 */
function filterByCategory<T extends { categoryId: string }>(
  transactions: T[],
  categoryId: string
): T[] {
  return transactions.filter((t) => t.categoryId === categoryId)
}

describe("formatAmount", () => {
  it("formats whole dollars correctly", () => {
    expect(formatAmount(100)).toBe("$100.00")
  })

  it("formats decimal amounts correctly", () => {
    expect(formatAmount(125.5)).toBe("$125.50")
  })

  it("formats zero correctly", () => {
    expect(formatAmount(0)).toBe("$0.00")
  })

  it("formats large numbers with commas", () => {
    expect(formatAmount(1234.56)).toBe("$1,234.56")
  })

  it("formats negative amounts", () => {
    expect(formatAmount(-50)).toBe("-$50.00")
  })
})

describe("filterByMonth", () => {
  const transactions = [
    { date: new Date("2026-01-15"), amount: 100, type: "INCOME" },
    { date: new Date("2026-01-20"), amount: 50, type: "EXPENSE" },
    { date: new Date("2026-02-10"), amount: 200, type: "INCOME" },
    { date: new Date("2025-12-25"), amount: 75, type: "EXPENSE" },
  ]

  it("returns transactions for January 2026", () => {
    const result = filterByMonth(transactions, 0, 2026)
    expect(result).toHaveLength(2)
  })

  it("returns transactions for February 2026", () => {
    const result = filterByMonth(transactions, 1, 2026)
    expect(result).toHaveLength(1)
  })

  it("returns empty array when no transactions match", () => {
    const result = filterByMonth(transactions, 5, 2026)
    expect(result).toHaveLength(0)
  })

  it("distinguishes same month in different years", () => {
    const result = filterByMonth(transactions, 11, 2025)
    expect(result).toHaveLength(1)
  })
})

describe("filterByCategory", () => {
  const transactions = [
    { categoryId: "cat-food", amount: 50, type: "EXPENSE" },
    { categoryId: "cat-rent", amount: 1000, type: "EXPENSE" },
    { categoryId: "cat-food", amount: 30, type: "EXPENSE" },
    { categoryId: "cat-salary", amount: 5000, type: "INCOME" },
  ]

  it("returns transactions for a specific category", () => {
    const result = filterByCategory(transactions, "cat-food")
    expect(result).toHaveLength(2)
  })

  it("returns empty array when category has no transactions", () => {
    const result = filterByCategory(transactions, "cat-transport")
    expect(result).toHaveLength(0)
  })

  it("returns single transaction for unique category", () => {
    const result = filterByCategory(transactions, "cat-rent")
    expect(result).toHaveLength(1)
  })
})