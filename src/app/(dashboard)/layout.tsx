import React from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="font-bold text-xl">Finance Tracker</h1>
          <div className="space-x-4">
            <a href="/dashboard" className="text-gray-600 hover:text-black">Dashboard</a>
            <a href="/transactions" className="text-gray-600 hover:text-black">Transactions</a>
            <button className="text-red-500">Logout</button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
