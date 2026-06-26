import { describe, it, expect } from "vitest"

interface Transaction {
  amount: number
  type: "INCOME" | "EXPENSE"
}

function calculateTotals(transactions: Transaction[]) {
  let totalIncome = 0
  let totalExpenses = 0

  transactions.forEach((t) => {
    if (t.type === "INCOME") {
      totalIncome += t.amount
    } else {
      totalExpenses += t.amount
    }
  })

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
  }
}

function calculateMonthlyData(
  transactions: (Transaction & { date: Date })[],
  year: number
) {
  const monthlyMap: { [key: number]: { income: number; expense: number } } = {}
  for (let i = 0; i < 12; i++) {
    monthlyMap[i] = { income: 0, expense: 0 }
  }

  transactions
    .filter((t) => new Date(t.date).getFullYear() === year)
    .forEach((t) => {
      const month = new Date(t.date).getMonth()
      if (t.type === "INCOME") {
        monthlyMap[month].income += t.amount
      } else {
        monthlyMap[month].expense += t.amount
      }
    })

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]

  return monthNames.map((name, index) => ({
    month: name,
    income: monthlyMap[index].income,
    expense: monthlyMap[index].expense,
  }))
}

describe("calculateTotals", () => {
  it("calculates income, expenses, and balance for mixed transactions", () => {
    const transactions: Transaction[] = [
      { amount: 5000, type: "INCOME" },
      { amount: 1500, type: "EXPENSE" },
      { amount: 200, type: "EXPENSE" },
      { amount: 3000, type: "INCOME" },
    ]

    const result = calculateTotals(transactions)
    expect(result.totalIncome).toBe(8000)
    expect(result.totalExpenses).toBe(1700)
    expect(result.balance).toBe(6300)
  })

  it("returns zero totals for empty transactions", () => {
    const result = calculateTotals([])
    expect(result.totalIncome).toBe(0)
    expect(result.totalExpenses).toBe(0)
    expect(result.balance).toBe(0)
  })

  it("handles only income transactions", () => {
    const transactions: Transaction[] = [
      { amount: 5000, type: "INCOME" },
      { amount: 3000, type: "INCOME" },
    ]

    const result = calculateTotals(transactions)
    expect(result.totalIncome).toBe(8000)
    expect(result.totalExpenses).toBe(0)
    expect(result.balance).toBe(8000)
  })

  it("handles only expense transactions", () => {
    const transactions: Transaction[] = [
      { amount: 1000, type: "EXPENSE" },
      { amount: 500, type: "EXPENSE" },
    ]

    const result = calculateTotals(transactions)
    expect(result.totalIncome).toBe(0)
    expect(result.totalExpenses).toBe(1500)
    expect(result.balance).toBe(-1500)
  })

  it("handles decimal amounts correctly", () => {
    const transactions: Transaction[] = [
      { amount: 1000.5, type: "INCOME" },
      { amount: 250.25, type: "EXPENSE" },
    ]

    const result = calculateTotals(transactions)
    expect(result.totalIncome).toBe(1000.5)
    expect(result.totalExpenses).toBe(250.25)
    expect(result.balance).toBe(750.25)
  })
})

describe("calculateMonthlyData", () => {
  it("aggregates data correctly for a year", () => {
    const transactions = [
      { amount: 5000, type: "INCOME" as const, date: new Date("2026-01-15") },
      { amount: 1500, type: "EXPENSE" as const, date: new Date("2026-01-20") },
      { amount: 3000, type: "INCOME" as const, date: new Date("2026-02-10") },
      { amount: 2000, type: "EXPENSE" as const, date: new Date("2026-02-15") },
    ]

    const result = calculateMonthlyData(transactions, 2026)
    expect(result[0]).toEqual({ month: "Jan", income: 5000, expense: 1500 })
    expect(result[1]).toEqual({ month: "Feb", income: 3000, expense: 2000 })
    expect(result[2].income).toBe(0)
    expect(result[2].expense).toBe(0)
  })

  it("returns all 12 months even with no data", () => {
    const result = calculateMonthlyData([], 2026)
    expect(result).toHaveLength(12)
    result.forEach((m) => {
      expect(m.income).toBe(0)
      expect(m.expense).toBe(0)
    })
  })

  it("filters by year correctly", () => {
    const transactions = [
      { amount: 100, type: "INCOME" as const, date: new Date("2025-12-01") },
      { amount: 200, type: "INCOME" as const, date: new Date("2026-01-01") },
    ]

    const result2025 = calculateMonthlyData(transactions, 2025)
    const result2026 = calculateMonthlyData(transactions, 2026)

    expect(result2025[11].income).toBe(100)
    expect(result2026[0].income).toBe(200)
  })
})