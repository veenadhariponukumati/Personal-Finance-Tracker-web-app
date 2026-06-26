"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

const CATEGORIES = [
  { id: "1", name: "Food" }, { id: "2", name: "Rent" }, { id: "3", name: "Transport" },
  { id: "4", name: "Shopping" }, { id: "5", name: "Entertainment" }, { id: "6", name: "Bills" },
  { id: "7", name: "Salary" }, { id: "8", name: "Other" },
]

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]

export function TransactionFilters({
  currentCategoryId, currentMonth, currentYear,
}: {
  currentCategoryId?: string; currentMonth?: string; currentYear?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/transactions?${params.toString()}`)
  }, [router, searchParams])

  const hasFilters = !!(currentCategoryId || currentMonth || currentYear)

  return (
    <div className="bg-white p-4 rounded-lg shadow flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[140px]">
        <label htmlFor="filter-category" className="block text-xs font-medium text-gray-600 mb-1">Category</label>
        <select id="filter-category" value={currentCategoryId ?? ""} onChange={(e) => updateFilter("categoryId", e.target.value || null)}
          className="block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500">
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
        </select>
      </div>
      <div className="flex-1 min-w-[120px]">
        <label htmlFor="filter-month" className="block text-xs font-medium text-gray-600 mb-1">Month</label>
        <select id="filter-month" value={currentMonth ?? ""} onChange={(e) => updateFilter("month", e.target.value || null)}
          className="block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500">
          <option value="">All Months</option>
          {MONTHS.map((name, i) => (<option key={i+1} value={i+1}>{name}</option>))}
        </select>
      </div>
      <div className="flex-1 min-w-[100px]">
        <label htmlFor="filter-year" className="block text-xs font-medium text-gray-600 mb-1">Year</label>
        <select id="filter-year" value={currentYear ?? ""} onChange={(e) => updateFilter("year", e.target.value || null)}
          className="block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500">
          <option value="">All Years</option>
          {Array.from({length:5}, (_,i) => new Date().getFullYear()-i).map((y) => (<option key={y} value={y}>{y}</option>))}
        </select>
      </div>
      {hasFilters && (
        <button onClick={() => router.push("/transactions")}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
          Clear Filters
        </button>
      )}
    </div>
  )
}