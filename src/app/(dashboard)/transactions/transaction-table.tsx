"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteTransaction } from "@/actions/transactions"
import { SuccessToast } from "@/components/ui/success-toast"
import { ErrorBanner } from "@/components/ui/error-banner"

interface Transaction {
  id: string; amount: number; description: string | null;
  date: Date; type: "INCOME" | "EXPENSE"; category: { name: string } | null
}

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id); setError(null)
    const result = await deleteTransaction(id)
    setDeletingId(null); setConfirmDeleteId(null)
    if (result.success) { setSuccessMsg("Transaction deleted!"); router.refresh() }
    else { setError(result.error ?? "Failed to delete transaction") }
  }

  return (
    <>
      {successMsg && <SuccessToast message={successMsg} onClose={() => setSuccessMsg(null)} />}
      {error && <ErrorBanner message={error} onClose={() => setError(null)} onRetryLabel="Dismiss" />}

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((txn) => (
              <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {new Date(txn.date).toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {txn.description || <span className="text-gray-400 italic">No description</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                    {txn.category?.name ?? "Uncategorized"}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${txn.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                  {txn.type === "INCOME" ? "+" : "-"}${txn.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  {confirmDeleteId === txn.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-gray-500">Sure?</span>
                      <button onClick={() => handleDelete(txn.id)} disabled={deletingId === txn.id}
                        className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50">
                        {deletingId === txn.id ? "..." : "Yes"}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-gray-500 hover:text-gray-700 text-xs">No</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/transactions/${txn.id}/edit`} className="text-blue-600 hover:text-blue-800 text-sm">Edit</a>
                      <button onClick={() => setConfirmDeleteId(txn.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {transactions.map((txn) => (
          <div key={txn.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-gray-900">{txn.description || <span className="text-gray-400 italic">No description</span>}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(txn.date).toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" })}
                </p>
              </div>
              <span className={`text-base font-bold ${txn.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                {txn.type === "INCOME" ? "+" : "-"}${txn.amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">{txn.category?.name ?? "Uncategorized"}</span>
              <div className="flex gap-3 text-sm">
                <a href={`/transactions/${txn.id}/edit`} className="text-blue-600 hover:text-blue-800">Edit</a>
                {confirmDeleteId === txn.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Sure?</span>
                    <button onClick={() => handleDelete(txn.id)} disabled={deletingId === txn.id}
                      className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50">{deletingId === txn.id ? "..." : "Yes"}</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-gray-500 hover:text-gray-700 text-xs">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(txn.id)} className="text-red-500 hover:text-red-700">Delete</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}