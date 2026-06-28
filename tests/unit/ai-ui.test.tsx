// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AiInsightCard } from "@/components/dashboard/ai-insight-card"
import { AskFinancesChat } from "@/components/dashboard/ask-finances"

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// ─── Mock fetch ───────────────────────────────────────────────────

let mockFetchResponse: {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

beforeEach(() => {
  vi.restoreAllMocks()
  mockFetchResponse = {
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  }
  globalThis.fetch = vi.fn().mockImplementation(async () => mockFetchResponse)
})

// ─── AiInsightCard ────────────────────────────────────────────────

describe("AiInsightCard", () => {
  it("renders in idle state with Generate Insight button", () => {
    render(<AiInsightCard />)

    expect(screen.getByText("AI Spending Insights")).toBeDefined()
    expect(screen.getByText("Generate Insight")).toBeDefined()
    expect(screen.getByText(/AI-powered summary/)).toBeDefined()
  })

  it("shows loading state after clicking generate", async () => {
    // Make fetch never resolve so we see loading
    globalThis.fetch = vi.fn().mockImplementation(
      () => new Promise(() => {}) // never resolves
    )

    render(<AiInsightCard />)
    fireEvent.click(screen.getByText("Generate Insight"))

    expect(await screen.findByText("Analyzing your finances…")).toBeDefined()
  })

  it("shows insight on success", async () => {
    mockFetchResponse = {
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          insight: "You spent 30% more on dining this month.",
          available: true,
        }),
    }

    render(<AiInsightCard />)
    fireEvent.click(screen.getByText("Generate Insight"))

    await waitFor(() => {
      expect(
        screen.getByText("You spent 30% more on dining this month.")
      ).toBeDefined()
    })

    expect(screen.getByText("Generate another insight")).toBeDefined()
  })

  it("shows unavailable state when insight is null", async () => {
    mockFetchResponse = {
      ok: true,
      status: 200,
      json: () => Promise.resolve({ insight: null, available: false }),
    }

    render(<AiInsightCard />)
    fireEvent.click(screen.getByText("Generate Insight"))

    await waitFor(() => {
      expect(
        screen.getByText(/AI insights are not available/)
      ).toBeDefined()
    })
  })

  it("shows unavailable state on 503", async () => {
    mockFetchResponse = {
      ok: false,
      status: 503,
      json: () => Promise.resolve({}),
    }

    render(<AiInsightCard />)
    fireEvent.click(screen.getByText("Generate Insight"))

    await waitFor(() => {
      expect(
        screen.getByText(/AI insights are not available/)
      ).toBeDefined()
    })
  })

  it("shows rate limited message on 429", async () => {
    mockFetchResponse = {
      ok: false,
      status: 429,
      json: () => Promise.resolve({ retryAfter: 30 }),
    }

    render(<AiInsightCard />)
    fireEvent.click(screen.getByText("Generate Insight"))

    await waitFor(() => {
      expect(screen.getByText(/Too many requests/)).toBeDefined()
      expect(screen.getByText(/30s/)).toBeDefined()
    })
  })

  it("shows error state on 401", async () => {
    mockFetchResponse = {
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Authentication required" }),
    }

    render(<AiInsightCard />)
    fireEvent.click(screen.getByText("Generate Insight"))

    await waitFor(() => {
      expect(screen.getByText(/log in again/)).toBeDefined()
    })
  })

  it("shows error state when fetch throws", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"))

    render(<AiInsightCard />)
    fireEvent.click(screen.getByText("Generate Insight"))

    await waitFor(() => {
      expect(screen.getByText(/Could not reach the server/)).toBeDefined()
    })
  })

  it("shows error state on generic failure", async () => {
    mockFetchResponse = {
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    }

    render(<AiInsightCard />)
    fireEvent.click(screen.getByText("Generate Insight"))

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/)).toBeDefined()
    })
  })

  it("can be dismissed", async () => {
    render(<AiInsightCard />)
    fireEvent.click(screen.getByLabelText("Dismiss AI insights card"))

    expect(screen.queryByText("AI Spending Insights")).toBeNull()
  })
})

// ─── AskFinancesChat ──────────────────────────────────────────────

describe("AskFinancesChat", () => {
  it("renders in empty state with prompt", () => {
    render(<AskFinancesChat />)

    expect(screen.getByText("Ask Finances")).toBeDefined()
    expect(screen.getByText(/How much did I spend on food/)).toBeDefined()
    expect(screen.getByPlaceholderText(/e\.g\. How much/)).toBeDefined()
    expect(screen.getByText("Ask")).toBeDefined()
  })

  it("shows validation error for empty input", async () => {
    render(<AskFinancesChat />)
    fireEvent.click(screen.getByText("Ask"))

    expect(screen.getByText("Please enter a question.")).toBeDefined()
  })

  it("adds user message and shows loading after sending", async () => {
    globalThis.fetch = vi.fn().mockImplementation(
      () => new Promise(() => {}) // never resolves
    )

    render(<AskFinancesChat />)
    const input = screen.getByRole("textbox")
    await userEvent.type(input, "How much on rent?")
    fireEvent.click(screen.getByText("Ask"))

    expect(screen.getByText("How much on rent?")).toBeDefined()
    expect(screen.getByText("Analyzing…")).toBeDefined()
  })

  it("shows AI response on success", async () => {
    mockFetchResponse = {
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          answer: "You spent $800 on Rent this month.",
          confidence: "high",
        }),
    }

    render(<AskFinancesChat />)
    const input = screen.getByRole("textbox")
    await userEvent.type(input, "How much on rent?")
    fireEvent.click(screen.getByText("Ask"))

    await waitFor(() => {
      expect(
        screen.getByText("You spent $800 on Rent this month.")
      ).toBeDefined()
    })
  })

  it("shows fallback response when confidence is null", async () => {
    mockFetchResponse = {
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          answer: "I'm sorry, I couldn't generate a response right now.",
          confidence: null,
        }),
    }

    render(<AskFinancesChat />)
    const input = screen.getByRole("textbox")
    await userEvent.type(input, "How much on rent?")
    fireEvent.click(screen.getByText("Ask"))

    await waitFor(() => {
      expect(
        screen.getByText("I'm sorry, I couldn't generate a response right now.")
      ).toBeDefined()
    })
  })

  it("shows unavailable message on 503", async () => {
    mockFetchResponse = {
      ok: false,
      status: 503,
      json: () => Promise.resolve({}),
    }

    render(<AskFinancesChat />)
    const input = screen.getByRole("textbox")
    await userEvent.type(input, "How much on rent?")
    fireEvent.click(screen.getByText("Ask"))

    await waitFor(() => {
      expect(
        screen.getByText(/AI chat is not available/)
      ).toBeDefined()
    })
  })

  it("shows rate limit error on 429", async () => {
    mockFetchResponse = {
      ok: false,
      status: 429,
      json: () => Promise.resolve({ retryAfter: 15 }),
    }

    render(<AskFinancesChat />)
    const input = screen.getByRole("textbox")
    await userEvent.type(input, "How much on rent?")
    fireEvent.click(screen.getByText("Ask"))

    await waitFor(() => {
      expect(
        screen.getByText(/Too many requests/)
      ).toBeDefined()
    })

    // Also shows inline rate limit warning below the form
    expect(screen.getByText(/15s/)).toBeDefined()
  })

  it("shows auth error on 401", async () => {
    mockFetchResponse = {
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Authentication required" }),
    }

    render(<AskFinancesChat />)
    const input = screen.getByRole("textbox")
    await userEvent.type(input, "How much on rent?")
    fireEvent.click(screen.getByText("Ask"))

    await waitFor(() => {
      expect(
        screen.getByText(/log in again/)
      ).toBeDefined()
    })
  })

  it("shows network error when fetch throws", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"))

    render(<AskFinancesChat />)
    const input = screen.getByRole("textbox")
    await userEvent.type(input, "How much on rent?")
    fireEvent.click(screen.getByText("Ask"))

    await waitFor(() => {
      expect(
        screen.getByText(/Could not reach the server/)
      ).toBeDefined()
    })
  })

  it("clears validation error when user types", async () => {
    render(<AskFinancesChat />)
    fireEvent.click(screen.getByText("Ask"))

    expect(screen.getByText("Please enter a question.")).toBeDefined()

    const input = screen.getByRole("textbox")
    await userEvent.type(input, "H")

    expect(screen.queryByText("Please enter a question.")).toBeNull()
  })
})