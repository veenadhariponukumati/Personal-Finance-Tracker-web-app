/**
 * In-memory rate limiter.
 *
 * Uses a sliding window per userId. Suitable for single-server
 * personal/prototype applications.
 *
 * ☢️ Production note: Replace with Redis or another distributed
 *    store when scaling beyond a single server instance.
 */

interface WindowEntry {
  timestamp: number
}

const stores = new Map<string, WindowEntry[]>()

/**
 * Checks if a request is allowed for the given userId.
 * Returns { allowed: true } if under the limit.
 * Returns { allowed: false, retryAfter } if over the limit.
 *
 * @param userId - Unique identifier for the user
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Window duration in milliseconds
 */
export function checkRateLimit(
  userId: string,
  maxRequests: number = 5,
  windowMs: number = 60_000
): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now()

  if (!stores.has(userId)) {
    stores.set(userId, [])
  }

  const entries = stores.get(userId)!
  const cutoff = now - windowMs

  // Remove expired entries
  while (entries.length > 0 && entries[0].timestamp < cutoff) {
    entries.shift()
  }

  if (entries.length >= maxRequests) {
    const oldest = entries[0].timestamp
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000)
    return { allowed: false, retryAfter }
  }

  entries.push({ timestamp: now })
  return { allowed: true }
}

/**
 * Clears all rate limit data. Useful for testing.
 */
export function resetRateLimits(): void {
  stores.clear()
}