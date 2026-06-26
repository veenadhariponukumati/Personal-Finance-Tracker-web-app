"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface MonthlyData {
  month: string
  income: number
  expense: number
}

export function MonthlyChart({ data }: { data: MonthlyData[] }) {
  const hasData = data.some((d) => d.income > 0 || d.expense > 0)

  if (!hasData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow h-72 flex flex-col items-center justify-center text-gray-400">
        <span className="text-4xl mb-2">📊</span>
        <p className="italic">No data for this year yet</p>
        <p className="text-sm mt-1">Add some transactions to see your monthly breakdown.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="font-bold mb-4 text-gray-800">Monthly Income vs Expenses</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value: unknown) => {
              const num = Number(value)
              return ["$" + num.toFixed(2), undefined]
            }}
          />
          <Legend />
          <Bar dataKey="income" fill="#16a34a" name="Income" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" fill="#dc2626" name="Expenses" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}