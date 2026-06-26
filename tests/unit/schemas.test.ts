import { describe, it, expect } from "vitest"
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
} from "@/schemas/transaction"

describe("CreateTransactionSchema", () => {
  const validInput = {
    amount: "100.50",
    type: "INCOME",
    categoryId: "cat-1",
    description: "Test transaction",
    date: "2026-01-15",
  }

  it("passes with valid input", () => {
    const result = CreateTransactionSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.amount).toBe(100.5)
      expect(result.data.type).toBe("INCOME")
      expect(result.data.categoryId).toBe("cat-1")
    }
  })

  it("passes with optional description omitted", () => {
    const { description, ...input } = validInput
    const result = CreateTransactionSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("passes with empty description string", () => {
    const result = CreateTransactionSchema.safeParse({
      ...validInput,
      description: "",
    })
    expect(result.success).toBe(true)
  })

  it("passes with valid EXPENSE type", () => {
    const result = CreateTransactionSchema.safeParse({
      ...validInput,
      type: "EXPENSE",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe("EXPENSE")
    }
  })

  it("fails with negative amount", () => {
    const result = CreateTransactionSchema.safeParse({
      ...validInput,
      amount: "-50",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("amount"))).toBe(true)
    }
  })

  it("fails with zero amount", () => {
    const result = CreateTransactionSchema.safeParse({
      ...validInput,
      amount: "0",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("amount"))).toBe(true)
    }
  })

  it("fails with missing type", () => {
    const { type, ...input } = validInput
    const result = CreateTransactionSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("fails with invalid type", () => {
    const result = CreateTransactionSchema.safeParse({
      ...validInput,
      type: "INVALID",
    })
    expect(result.success).toBe(false)
  })

  it("fails with missing categoryId", () => {
    const { categoryId, ...input } = validInput
    const result = CreateTransactionSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("fails with empty categoryId", () => {
    const result = CreateTransactionSchema.safeParse({
      ...validInput,
      categoryId: "",
    })
    expect(result.success).toBe(false)
  })
})

describe("UpdateTransactionSchema", () => {
  it("passes with valid partial update (amount only)", () => {
    const result = UpdateTransactionSchema.safeParse({
      amount: "250.00",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.amount).toBe(250)
    }
  })

  it("passes with valid partial update (type only)", () => {
    const result = UpdateTransactionSchema.safeParse({
      type: "EXPENSE",
    })
    expect(result.success).toBe(true)
  })

  it("passes with full update data", () => {
    const result = UpdateTransactionSchema.safeParse({
      amount: "75.00",
      type: "EXPENSE",
      categoryId: "cat-2",
      description: "Updated transaction",
      date: "2026-02-10",
    })
    expect(result.success).toBe(true)
  })

  it("passes with empty object (all fields optional)", () => {
    const result = UpdateTransactionSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("fails with negative amount", () => {
    const result = UpdateTransactionSchema.safeParse({
      amount: "-10",
    })
    expect(result.success).toBe(false)
  })
})