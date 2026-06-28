import { describe, it, expect } from "vitest"
import { validateChatResponse, validateInsightResponse } from "@/ai/validate"

describe("validateChatResponse", () => {
  it("accepts valid chat response", () => {
    const result = validateChatResponse(
      JSON.stringify({
        answer: "You spent $450 on Food last month.",
        confidence: "high",
      })
    )
    expect(result.answer).toBe("You spent $450 on Food last month.")
    expect(result.confidence).toBe("high")
  })

  it("accepts medium confidence", () => {
    const result = validateChatResponse(
      JSON.stringify({
        answer: "I don't have enough data to answer that.",
        confidence: "low",
      })
    )
    expect(result.confidence).toBe("low")
  })

  it("rejects empty answer", () => {
    expect(() =>
      validateChatResponse(
        JSON.stringify({
          answer: "",
          confidence: "high",
        })
      )
    ).toThrow()
  })

  it("rejects invalid confidence value", () => {
    expect(() =>
      validateChatResponse(
        JSON.stringify({
          answer: "some answer",
          confidence: "very_high",
        })
      )
    ).toThrow()
  })

  it("rejects missing answer field", () => {
    expect(() =>
      validateChatResponse(
        JSON.stringify({
          confidence: "high",
        })
      )
    ).toThrow()
  })

  it("rejects non-JSON input", () => {
    expect(() => validateChatResponse("not json")).toThrow()
  })
})

describe("validateInsightResponse", () => {
  it("accepts valid insight response", () => {
    const result = validateInsightResponse(
      JSON.stringify({
        insight: "You spent 15% more this month than last.",
      })
    )
    expect(result.insight).toBe("You spent 15% more this month than last.")
  })

  it("rejects empty insight", () => {
    expect(() =>
      validateInsightResponse(
        JSON.stringify({
          insight: "",
        })
      )
    ).toThrow()
  })

  it("rejects missing insight field", () => {
    expect(() => validateInsightResponse(JSON.stringify({}))).toThrow()
  })

  it("rejects non-JSON input", () => {
    expect(() => validateInsightResponse("not json")).toThrow()
  })
})