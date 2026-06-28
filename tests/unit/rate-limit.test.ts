import { describe, it, expect, beforeEach } from "vitest"
import { checkRateLimit, resetRateLimits } from "@/lib/rate-limit"

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimits()
  })

  it("allows requests under the limit", () => {
    const result = checkRateLimit("user-1", 3, 60_000)
    expect(result.allowed).toBe(true)
  })

  it("allows exactly the limit", () => {
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit("user-1", 3, 60_000)
      expect(result.allowed).toBe(true)
    }
  })

  it("blocks requests over the limit", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("user-1", 3, 60_000)
    }
    const result = checkRateLimit("user-1", 3, 60_000)
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.retryAfter).toBeGreaterThan(0)
    }
  })

  it("tracks users independently", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("user-1", 3, 60_000)
    }
    // user-2 should still be allowed
    const result = checkRateLimit("user-2", 3, 60_000)
    expect(result.allowed).toBe(true)
  })
})