"use client"

import { useState, useCallback } from "react"

type InsightState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; insight: string }
  | { status: "error"; message: string }
  | { status: "rate_limited"; retryAfter: number }
  | { status: "unavailable" }

export function AiInsightCard() {
  const [state, setState] = useState<InsightState>({ status: "idle" })
  const [dismissed, setDismissed] = useState(false)

  const generateInsight = useCallback(async () => {
    setState({ status: "loading" })
    try {
      const res = await fetch("/api/copilot/insights")

      if (res.status === 429) {
        const body = await res.json()
        setState({ status: "rate_limited", retryAfter: body.retryAfter ?? 30 })
        return
      }

      if (res.status === 503) {
        setState({ status: "unavailable" })
        return
      }

      if (res.status === 401) {
        setState({ status: "error", message: "Please log in again to use AI features." })
        return
      }

      if (!res.ok) {
        setState({ status: "error", message: "Something went wrong. Please try again." })
        return
      }

      const body = await res.json()

      if (!body.insight) {
        setState({
          status: "unavailable",
        })
        return
      }

      setState({ status: "success", insight: body.insight })
    } catch {
      setState({ status: "error", message: "Could not reach the server. Please try again." })
    }
  }, [])

  const dismiss = useCallback(() => {
    setDismissed(true)
  }, [])

  if (dismissed) return null

  return (
    <div className="bg-white p-5 md:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="AI">
            ✨
          </span>
          <h3 className="text-base font-semibold text-gray-900">
            AI Spending Insights
          </h3>
        </div>
        <button
          onClick={dismiss}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="Dismiss AI insights card"
        >
          ✕
        </button>
      </div>

      {state.status === "idle" && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-3">
            Get an AI-powered summary of your spending patterns and trends.
          </p>
          <button
            onClick={generateInsight}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm"
          >
            <span>💰</span>
            Generate Insight
          </button>
          <p className="text-xs text-gray-400 mt-3">
            AI may be unavailable if no API key is configured. Your data stays private.
          </p>
        </div>
      )}

      {state.status === "loading" && (
        <div className="mt-4 animate-pulse">
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <div className="h-5 w-5 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
            <p className="text-sm text-purple-700 font-medium">
              Analyzing your finances…
            </p>
          </div>
        </div>
      )}

      {state.status === "success" && (
        <div className="mt-4">
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-sm text-gray-800 leading-relaxed">
              {state.insight}
            </p>
          </div>
          <button
            onClick={generateInsight}
            className="mt-3 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
          >
            Generate another insight
          </button>
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-4">
          <div className="p-3 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
            <span className="text-red-500 shrink-0">⚠️</span>
            <div>
              <p className="text-sm text-red-700">{state.message}</p>
              <button
                onClick={generateInsight}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium underline transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {state.status === "rate_limited" && (
        <div className="mt-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-2">
            <span className="text-amber-500 shrink-0">⏳</span>
            <div>
              <p className="text-sm text-amber-700">
                Too many requests. Please wait{" "}
                <strong>{state.retryAfter}s</strong> before trying again.
              </p>
            </div>
          </div>
        </div>
      )}

      {state.status === "unavailable" && (
        <div className="mt-4">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">
              AI insights are not available right now. This usually means no
              API key is configured. You can continue using all other features
              normally.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}