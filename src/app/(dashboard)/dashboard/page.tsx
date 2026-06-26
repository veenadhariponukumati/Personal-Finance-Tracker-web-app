import { Suspense } from "react"
import { getDashboardSummary, getMonthlyData } from "@/actions/dashboard"
import { MonthlyChart } from "@/components/dashboard/monthly-chart"
import { ErrorBanner } from "@/components/ui/error-banner"
import { SkeletonCard } from "@/components/ui/loading"

async function SummaryCards() {
  const summaryRes = await getDashboardSummary()
  if (!summaryRes.success || !summaryRes.data) {
    return <ErrorBanner message={summaryRes.error ?? "Failed to load dashboard data"} onRetryLabel="Reload page" />
  }

  const { totalIncome, totalExpenses, balance } = summaryRes.data
  const hasData = totalIncome > 0 || totalExpenses > 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
      <div className="bg-white p-5 md:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
        <p className="text-gray-500 text-xs md:text-sm tracking-wide uppercase">Total Income</p>
        <p className="text-xl md:text-2xl font-bold text-green-600 mt-1">${totalIncome.toFixed(2)}</p>
        {!hasData && <p className="text-xs text-gray-400 mt-1">No income yet</p>}
      </div>
      <div className="bg-white p-5 md:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
        <p className="text-gray-500 text-xs md:text-sm tracking-wide uppercase">Total Expenses</p>
        <p className="text-xl md:text-2xl font-bold text-red-600 mt-1">${totalExpenses.toFixed(2)}</p>
        {!hasData && <p className="text-xs text-gray-400 mt-1">No expenses yet</p>}
      </div>
      <div className="bg-white p-5 md:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
        <p className="text-gray-500 text-xs md:text-sm tracking-wide uppercase">Current Balance</p>
        <p className={`text-xl md:text-2xl font-bold mt-1 ${balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
          ${balance.toFixed(2)}
        </p>
        {!hasData && <p className="text-xs text-gray-400 mt-1">Add transactions to see your balance</p>}
      </div>
    </div>
  )
}

async function ChartSection() {
  const currentYear = new Date().getFullYear()
  const chartRes = await getMonthlyData(currentYear)
  if (!chartRes.success || !chartRes.data) {
    return <ErrorBanner message={chartRes.error ?? "Failed to load chart data"} onRetryLabel="Reload page" />
  }
  return <MonthlyChart data={chartRes.data} />
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 text-sm">Your financial overview</p>
        </div>
      </div>

      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      }>
        <SummaryCards />
      </Suspense>

      <Suspense fallback={
        <div className="bg-white p-6 rounded-lg shadow animate-pulse h-72 flex items-center justify-center">
          <div className="h-6 bg-gray-200 rounded w-48" />
        </div>
      }>
        <ChartSection />
      </Suspense>
    </div>
  )
}