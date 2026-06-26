import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="font-bold text-xl">Finance Tracker</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">{session.user?.email}</span>
            <a href="/dashboard" className="text-gray-600 hover:text-black">Dashboard</a>
            <a href="/transactions" className="text-gray-600 hover:text-black">Transactions</a>
            <a href="/api/auth/signout" className="text-red-500 text-sm">Logout</a>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
