"use client"

import { useState, useEffect } from "react"

export function SuccessToast({ message, onClose }: { message: string; onClose?: () => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onClose?.()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  if (!visible) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
      <span>✓</span>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={() => { setVisible(false); onClose?.() }} className="ml-2 text-white/80 hover:text-white">
        ✕
      </button>
    </div>
  )
}