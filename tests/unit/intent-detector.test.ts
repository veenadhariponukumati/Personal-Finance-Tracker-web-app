import { describe, it, expect } from "vitest"
import { detectIntent } from "@/ai/intent-detector"

describe("detectIntent", () => {
  it("detects category_query for food spending", () => {
    const result = detectIntent("How much did I spend on food last month?")
    expect(result.intent).toBe("category_query")
    expect(result.params?.categoryName).toBe("Food")
  })

  it("detects category_query for groceries", () => {
    const result = detectIntent("what did I spend on groceries")
    expect(result.intent).toBe("category_query")
    expect(result.params?.categoryName).toBe("Food")
  })

  it("detects comparison intent", () => {
    const result = detectIntent("Compare this month with last month")
    expect(result.intent).toBe("comparison")
  })

  it("detects comparison intent with 'vs'", () => {
    const result = detectIntent("spending vs last month")
    expect(result.intent).toBe("comparison")
  })

  it("detects budget intent", () => {
    const result = detectIntent("Am I over budget on food?")
    expect(result.intent).toBe("budget")
  })

  it("detects recurring intent", () => {
    const result = detectIntent("What subscriptions do I have?")
    expect(result.intent).toBe("recurring")
  })

  it("detects merchant intent for Amazon", () => {
    const result = detectIntent("How much did I spend on Amazon?")
    expect(result.intent).toBe("merchant")
  })

  it("detects merchant intent for Netflix", () => {
    const result = detectIntent("how much for netflix")
    expect(result.intent).toBe("merchant")
  })

  it("detects trend intent", () => {
    const result = detectIntent("Show my spending trend")
    expect(result.intent).toBe("trend")
  })

  it("returns general for empty string", () => {
    const result = detectIntent("")
    expect(result.intent).toBe("general")
  })

  it("returns general for gibberish", () => {
    const result = detectIntent("asdf zxcv qwerty")
    expect(result.intent).toBe("general")
  })

  it("detects comparison for 'why did I spend more'", () => {
    const result = detectIntent("Why did I spend more this month?")
    expect(result.intent).toBe("comparison")
  })
})