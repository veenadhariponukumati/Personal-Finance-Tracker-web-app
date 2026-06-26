import { Suspense } from "react"
import { getTransactions } from "@/actions/transactions"
import { getCategories } from "@/actions/dashboard"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorBanner } from "@/components/ui/error-banner"
import { SkeletonTable } from "@/components/ui/loading"
import { TransactionFilters } from "./transaction-filters"
import { TransactionTable } from "./transaction-table"

interface PageProps {
  searchParams: Promise<{ categoryId?: string; month?: string; year?: string }>
}

async function TransactionList({ categoryId, month, year }: { categoryId?: string; month?: string; year?: string }) {
  const filters: { categoryId?: string; month?: number; year?: number } = {}
  if (categoryId) filters.categoryId = categoryId
  if (month) filters.month = parseInt(month, 10) - 1
  if (year) filters.year = parseInt(year, 10)

  const result = await getTransactions(filters)
  if (!result.success) {
    return <ErrorBanner message={result.error ?? "Failed to load transactions"} onRetryLabel="Reload page" />
  }

  const transactions = result.data ?? []
  if (transactions.length === 0) {
    const hasFilters = !!(categoryId || month || year)
    return (
      <EmptyState
        title={hasFilters ? "No matching transactions" : "No transactions yet"}
        description={hasFilters ? "Try adjusting your filters to see more results." : "Add your first transaction to start tracking your finances!"}
        action={hasFilters ? undefined : { label: "Add Transaction", href: "/transactions/new" }}
      />
    )
  }

  return <TransactionTable transactions={transactions} />
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session) redirect("/login")

  const params = await searchParams
  const categoriesRes = await getCategories()
  const categories = categoriesRes.success ? (categoriesRes.data ?? []) : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Transactions</h2>
          <p className="text-gray-500 text-sm">Manage your income and expenses</p>
        </div>
        <a href="/transactions/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center text-sm font-medium">
          Add Transaction
        </a>
      </div>

      <TransactionFilters currentCategoryId={params.categoryId} currentMonth={params.month} currentYear={params.year} categories={categories} />

      <Suspense fallback={<SkeletonTable />}>
        <TransactionList categoryId={params.categoryId} month={params.month} year={params.year} />
      </Suspense>
    </div>
  )
}