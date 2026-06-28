import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Mock } from "vitest"

// Mock Prisma before importing the module under test
vi.mock("@/lib/prisma", () => ({
  default: {
    transaction: {
      findMany: vi.fn(),
    },
  },
}))

import prisma from "@/lib/prisma"
import {
  getCategorySpending,
  getMonthlyTrend,
  getTopMerchants,
  getSavingsRate,
  getIncomeVsExpenses,
  getSpendingDeltas,
} from "@/services/analytics-engine"

const mockFindMany = prisma.transaction.findMany as Mock

const userId = "user-1"

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Helpers ───────────────────────────────────────────────────────

function tx(overrides: Record<string, unknown> = {}) {
  return {
    id: "tx-1",
    amount: 100,
    description: "test",
    date: new Date("2026-01-15"),
    type: "EXPENSE",
    userId,
    categoryId: "cat-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: "cat-1", name: "Food" },
    ...overrides,
  }
}

// ─── getCategorySpending ──────────────────────────────────────────

describe("getCategorySpending", () => {
  it("returns category breakdown sorted by amount descending", async () => {
    mockFindMany.mockResolvedValue([
      tx({ amount: 100, category: { id: "cat-1", name: "Food" } }),
      tx({ amount: 200, category: { id: "cat-2", name: "Rent" } }),
      tx({ amount: 50, category: { id: "cat-1", name: "Food" } }),
    ])

    const result = await getCategorySpending(userId, 1, 2026)

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe("Rent") // highest first
    expect(result[0].amount).toBe(200)
    expect(result[0].percentage).toBe(57) // 200/350 ≈ 57%
    expect(result[1].name).toBe("Food")
    expect(result[1].amount).toBe(150)
    expect(result[1].percentage).toBe(43)
  })

  it("returns empty array when no expenses", async () => {
    mockFindMany.mockResolvedValue([])
    const result = await getCategorySpending(userId, 1, 2026)
    expect(result).toEqual([])
  })

  it("only includes EXPENSE transactions", async () => {
    mockFindMany.mockResolvedValue([
      tx({ amount: 100, type: "EXPENSE", category: { id: "cat-1", name: "Food" } }),
      tx({ amount: 5000, type: "INCOME", category: { id: "cat-8", name: "Salary" } }),
    ])

    const result = await getCategorySpending(userId, 1, 2026)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Food")
  })

  it("handles decimal amounts", async () => {
    mockFindMany.mockResolvedValue([
      tx({ amount: 99.99, category: { id: "cat-1", name: "Food" } }),
      tx({ amount: 49.5, category: { id: "cat-3", name: "Transport" } }),
    ])

    const result = await getCategorySpending(userId, 1, 2026)

    expect(result[0].amount).toBe(99.99)
    expect(result[1].amount).toBe(49.5)
  })

  it("scopes query to the given userId", async () => {
    mockFindMany.mockResolvedValue([])
    await getCategorySpending("user-2", 1, 2026)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-2" }),
      })
    )
  })
})

// ─── getMonthlyTrend ──────────────────────────────────────────────

describe("getMonthlyTrend", () => {
  it("returns monthly income/expense for last N months", async () => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    mockFindMany.mockResolvedValue([
      tx({ amount: 5000, type: "INCOME", date: new Date(currentYear, currentMonth - 1, 1) }),
      tx({ amount: 1500, type: "EXPENSE", date: new Date(currentYear, currentMonth - 1, 15) }),
    ])

    const result = await getMonthlyTrend(userId, 1)

    expect(result).toHaveLength(1)
    expect(result[0].income).toBe(5000)
    expect(result[0].expense).toBe(1500)
  })

  it("returns 0 values when no transactions", async () => {
    mockFindMany.mockResolvedValue([])
    const result = await getMonthlyTrend(userId, 3)
    expect(result).toHaveLength(3)
    for (const month of result) {
      expect(month.income).toBe(0)
      expect(month.expense).toBe(0)
    }
  })
})

// ─── getTopMerchants ──────────────────────────────────────────────

describe("getTopMerchants", () => {
  it("returns top merchants by total spending", async () => {
    mockFindMany.mockResolvedValue([
      tx({ amount: 50, description: "Uber Eats" }),
      tx({ amount: 30, description: "Uber Eats" }),
      tx({ amount: 200, description: "Amazon" }),
      tx({ amount: 10, description: "Starbucks" }),
    ])

    const result = await getTopMerchants(userId, 1, 2026, 3)

    expect(result).toHaveLength(3)
    expect(result[0].merchant).toBe("amazon") // highest first
    expect(result[0].total).toBe(200)
    expect(result[1].merchant).toBe("uber eats")
    expect(result[1].total).toBe(80)
    expect(result[1].count).toBe(2)
  })

  it("returns empty array when no expense transactions with descriptions", async () => {
    mockFindMany.mockResolvedValue([])
    const result = await getTopMerchants(userId, 1, 2026)
    expect(result).toEqual([])
  })

  it("limits results to the specified count", async () => {
    mockFindMany.mockResolvedValue([
      tx({ amount: 10, description: "A" }),
      tx({ amount: 20, description: "B" }),
      tx({ amount: 30, description: "C" }),
    ])

    const result = await getTopMerchants(userId, 1, 2026, 2)
    expect(result).toHaveLength(2)
  })
})

// ─── getSavingsRate ───────────────────────────────────────────────

describe("getSavingsRate", () => {
  it("calculates savings rate correctly", async () => {
    mockFindMany.mockResolvedValue([
      tx({ amount: 5000, type: "INCOME" }),
      tx({ amount: 3000, type: "EXPENSE" }),
    ])

    const result = await getSavingsRate(userId, 1, 2026)

    expect(result.totalIncome).toBe(5000)
    expect(result.totalExpenses).toBe(3000)
    expect(result.savingsRate).toBe(40) // (5000-3000)/5000 * 100
  })

  it("returns 0 savings rate when no income", async () => {
    mockFindMany.mockResolvedValue([
      tx({ amount: 100, type: "EXPENSE" }),
    ])

    const result = await getSavingsRate(userId, 1, 2026)
    expect(result.savingsRate).toBe(0)
  })

  it("handles negative savings rate (spending exceeds income)", async () => {
    mockFindMany.mockResolvedValue([
      tx({ amount: 2000, type: "INCOME" }),
      tx({ amount: 2500, type: "EXPENSE" }),
    ])

    const result = await getSavingsRate(userId, 1, 2026)
    expect(result.savingsRate).toBe(-25)
  })

  it("returns 100% savings rate when no expenses", async () => {
    mockFindMany.mockResolvedValue([
      tx({ amount: 5000, type: "INCOME" }),
    ])

    const result = await getSavingsRate(userId, 1, 2026)
    expect(result.savingsRate).toBe(100)
  })
})

// ─── getIncomeVsExpenses ──────────────────────────────────────────

describe("getIncomeVsExpenses", () => {
  it("returns income, expenses, and balance", async () => {
    mockFindMany.mockResolvedValue([
      tx({ amount: 5000, type: "INCOME" }),
      tx({ amount: 1500, type: "EXPENSE" }),
      tx({ amount: 200, type: "EXPENSE" }),
    ])

    const result = await getIncomeVsExpenses(userId, 1, 2026)

    expect(result.totalIncome).toBe(5000)
    expect(result.totalExpenses).toBe(1700)
    expect(result.balance).toBe(3300)
  })

  it("returns zeros for empty month", async () => {
    mockFindMany.mockResolvedValue([])
    const result = await getIncomeVsExpenses(userId, 1, 2026)
    expect(result.totalIncome).toBe(0)
    expect(result.totalExpenses).toBe(0)
    expect(result.balance).toBe(0)
  })
})

// ─── getSpendingDeltas ────────────────────────────────────────────

describe("getSpendingDeltas", () => {
  it("compares spending between two months", async () => {
    // Current month: Food $100, Transport $50
    mockFindMany.mockResolvedValueOnce([
      tx({ amount: 100, category: { id: "cat-1", name: "Food" }, date: new Date("2026-02-01") }),
      tx({ amount: 50, category: { id: "cat-3", name: "Transport" }, date: new Date("2026-02-01") }),
    ])
    // Previous month: Food $80, Transport $60, Shopping $30
    mockFindMany.mockResolvedValueOnce([
      tx({ amount: 80, category: { id: "cat-1", name: "Food" }, date: new Date("2026-01-01") }),
      tx({ amount: 60, category: { id: "cat-3", name: "Transport" }, date: new Date("2026-01-01") }),
      tx({ amount: 30, category: { id: "cat-4", name: "Shopping" }, date: new Date("2026-01-01") }),
    ])

    const result = await getSpendingDeltas(userId, 2, 2026, 1, 2026)

    expect(result.currentTotal).toBe(150)
    expect(result.previousTotal).toBe(170)
    expect(result.totalDelta).toBe(-20)

    // Find the Food category
    const food = result.categories.find((c) => c.categoryName === "Food")
    expect(food?.currentAmount).toBe(100)
    expect(food?.previousAmount).toBe(80)
    expect(food?.delta).toBe(20) // spent $20 more on food
  })

  it("handles categories that appear in one month but not the other", async () => {
    mockFindMany.mockResolvedValueOnce([
      tx({ amount: 100, category: { id: "cat-1", name: "Food" }, date: new Date("2026-02-01") }),
    ])
    mockFindMany.mockResolvedValueOnce([])

    const result = await getSpendingDeltas(userId, 2, 2026, 1, 2026)

    expect(result.currentTotal).toBe(100)
    expect(result.previousTotal).toBe(0)
    expect(result.totalDelta).toBe(100)
  })

  it("sorts categories by absolute delta descending", async () => {
    mockFindMany.mockResolvedValueOnce([
      tx({ amount: 10, category: { id: "cat-1", name: "A" }, date: new Date("2026-02-01") }),
      tx({ amount: 100, category: { id: "cat-2", name: "B" }, date: new Date("2026-02-01") }),
    ])
    mockFindMany.mockResolvedValueOnce([
      tx({ amount: 50, category: { id: "cat-1", name: "A" }, date: new Date("2026-01-01") }),
      tx({ amount: 20, category: { id: "cat-2", name: "B" }, date: new Date("2026-01-01") }),
    ])

    const result = await getSpendingDeltas(userId, 2, 2026, 1, 2026)

    // B has delta 80, A has delta -40 → B first (abs 80 > abs 40)
    expect(result.categories[0].categoryName).toBe("B")
    expect(result.categories[1].categoryName).toBe("A")
  })
})