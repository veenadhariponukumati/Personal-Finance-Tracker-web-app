"use client"

import { useState, useRef, useCallback } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isError?: boolean
  isFallback?: boolean
}

type AskState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "rate_limited"; retryAfter: number }

export function AskFinancesChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [askState, setAskState] = useState<AskState>({ status: "idle" })
  const [validationError, setValidationError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const trimmed = input.trim()

      // Client-side validation
      if (!trimmed) {
        setValidationError("Please enter a question.")
        return
      }
      if (trimmed.length > 500) {
        setValidationError("Question must be 500 characters or less.")
        return
      }

      setValidationError(null)

      // Add user message
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      }
      setMessages((prev) => [...prev, userMsg])
      setInput("")
      setAskState({ status: "loading" })

      try {
        const res = await fetch("/api/copilot/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        })

        if (res.status === 429) {
          const body = await res.json()
          setAskState({ status: "rate_limited", retryAfter: body.retryAfter ?? 30 })
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `⏳ Too many requests. Please wait ${body.retryAfter ?? 30} seconds before asking again.`,
              isError: true,
            },
          ])
          return
        }

        if (res.status === 503) {
          setAskState({ status: "idle" })
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content:
                "AI chat is not available right now. This usually means no API key is configured. You can continue using all other features normally.",
              isFallback: true,
            },
          ])
          return
        }

        if (res.status === 401) {
          setAskState({ status: "idle" })
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: "Please log in again to use the AI assistant.",
              isError: true,
            },
          ])
          return
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setAskState({ status: "idle" })
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: body.error ?? "Something went wrong. Please try again.",
              isError: true,
            },
          ])
          return
        }

        const body = await res.json()
        setAskState({ status: "idle" })

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: body.answer,
            isFallback: body.confidence === null,
          },
        ])
      } catch {
        setAskState({ status: "idle" })
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Could not reach the server. Please check your connection and try again.",
            isError: true,
          },
        ])
      }
    },
    [input]
  )

  const scrollToBottomRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) node.scrollIntoView({ behavior: "smooth" })
    },
    []
  )

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-5 md:p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="Chat">
            💬
          </span>
          <h3 className="text-base font-semibold text-gray-900">
            Ask Finances
          </h3>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Ask questions about your spending in plain English.
        </p>
      </div>

      {/* Messages */}
      <div className="p-5 md:p-6 min-h-[200px] max-h-[320px] overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-3xl mb-2">🤔</span>
            <p className="text-sm text-gray-400">
              Ask something like &ldquo;How much did I spend on food?&rdquo;
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={msg.id}
            ref={i === messages.length - 1 ? scrollToBottomRef : undefined}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : msg.isError
                    ? "bg-red-50 border border-red-100 text-red-700"
                    : msg.isFallback
                      ? "bg-amber-50 border border-amber-100 text-amber-800"
                      : "bg-gray-50 border border-gray-200 text-gray-800"
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
          </div>
        ))}

        {askState.status === "loading" && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
              <span className="text-gray-500">Analyzing…</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        ref={formRef}
        onSubmit={sendMessage}
        className="p-4 md:p-5 border-t border-gray-100"
      >
        {validationError && (
          <p className="text-xs text-red-600 mb-2" role="alert">
            {validationError}
          </p>
        )}
        {askState.status === "rate_limited" && (
          <p className="text-xs text-amber-600 mb-2" role="alert">
            ⏳ Please wait {askState.retryAfter}s before sending another
            question.
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              if (validationError) setValidationError(null)
            }}
            placeholder="e.g. How much did I spend on food?"
            disabled={askState.status === "loading"}
            maxLength={500}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            aria-label="Ask a question about your finances"
          />
          <button
            type="submit"
            disabled={
              askState.status === "loading" ||
              askState.status === "rate_limited"
            }
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Ask
          </button>
        </div>
      </form>
    </div>
  )
}