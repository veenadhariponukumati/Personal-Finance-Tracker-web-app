"use client"

import { useState } from "react"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
]

export function NavBar({ userEmail }: { userEmail?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href="/dashboard" className="text-xl font-bold text-gray-900">
              💰 Finance Tracker
            </a>
          </div>
          <div className="hidden sm:flex items-center space-x-6">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                {item.label}
              </a>
            ))}
            {userEmail && <span className="text-xs text-gray-400 hidden lg:inline">{userEmail}</span>}
            <a href="/api/auth/signout" className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors">
              Logout
            </a>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        {mobileOpen && (
          <div className="sm:hidden pb-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md text-sm font-medium"
                onClick={() => setMobileOpen(false)}>
                {item.label}
              </a>
            ))}
            <a href="/api/auth/signout" className="block px-3 py-2 text-red-500 hover:bg-red-50 rounded-md text-sm font-medium"
              onClick={() => setMobileOpen(false)}>
              Logout
            </a>
          </div>
        )}
      </div>
    </nav>
  )
}