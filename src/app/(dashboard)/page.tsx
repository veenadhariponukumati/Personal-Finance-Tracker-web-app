import { getDashboardSummary } from "@/actions/dashboard"

export default async function DashboardPage() {
  const summaryRes = await getDashboardSummary()
  const summary = summaryRes.success ? summaryRes.data : { totalIncome: 0, totalExpenses: 0, balance: 0 }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Total Income</p>
          <p className="text-2xl font-bold text-green-600">
            ${summary.totalIncome.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">
            ${summary.totalExpenses.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Current Balance</p>
          <p className="text-2xl font-bold">
            ${summary.balance.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow h-64 flex flex-col items-center justify-center text-gray-400">
        <span className="italic">Chart placeholder (Recharts)</span>
        <p className="text-sm mt-2">Monthly income vs expenses will be displayed here.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold mb-4">Recent Transactions</h3>
          <p className="text-sm text-gray-500 italic">No recent transactions to display.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold mb-4">Top Categories</h3>
          <p className="text-sm text-gray-500 italic">No category data to display.</p>
        </div>
      </div>
    </div>
  )
}
