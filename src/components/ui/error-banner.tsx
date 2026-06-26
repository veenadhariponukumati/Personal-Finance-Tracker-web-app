"use client"

import { useState } from "react"

export function ErrorBanner({
  message,
  onRetryLabel,
  onClose,
}: {
  message: string
  onRetryLabel?: string
  onClose?: () => void
}) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="text-red-500 text-xl shrink-0">⚠️</span>
        <div>
          <p className="text-red-700 font-medium text-sm">Something went wrong</p>
          <p className="text-red-600 text-sm mt-1">{message}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onRetryLabel && (
          <button
            onClick={() => window.location.reload()}
            className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition-colors"
          >
            {onRetryLabel}
          </button>
        )}
        {onClose && (
          <button
            onClick={() => { setDismissed(true); onClose() }}
            className="text-red-400 hover:text-red-600 text-lg leading-none"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
        {!onClose && (
          <button
            onClick={() => setDismissed(true)}
            className="text-red-400 hover:text-red-600 text-lg leading-none"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}