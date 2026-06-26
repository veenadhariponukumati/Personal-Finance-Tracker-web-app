export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Total Income</p>
          <p className="text-2xl font-bold text-green-600">$0.00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">$0.00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Current Balance</p>
          <p className="text-2xl font-bold">$0.00</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow h-64 flex items-center justify-center text-gray-400 italic">
        Chart placeholder
      </div>
    </div>
  )
}
