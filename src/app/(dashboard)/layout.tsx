import React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NavBar } from "@/components/dashboard/nav-bar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar userEmail={session.user?.email ?? undefined} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}