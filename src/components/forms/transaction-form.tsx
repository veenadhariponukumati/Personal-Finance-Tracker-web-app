"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createTransaction, updateTransaction } from "@/actions/transactions"
import type { CreateTransactionInput } from "@/schemas/transaction"

interface Category {
  id: string
  name: string
}

interface TransactionFormProps {
  initialData?: {
    id: string
    amount: number
    description: string | null
    date: Date
    type: "INCOME" | "EXPENSE"
    categoryId: string
  }
  categories: Category[]
  onSuccess?: () => void
  onCancel?: () => void
}

type FormErrors = Partial<Record<keyof CreateTransactionInput, string>>

export function TransactionForm({ initialData, categories, onSuccess, onCancel }: TransactionFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "")
  const [type, setType] = useState<"INCOME" | "EXPENSE">(initialData?.type ?? "EXPENSE")
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "")
  const [date, setDate] = useState(
    initialData?.date
      ? new Date(initialData.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  )
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setServerError(null)
    setSuccess(null)
    setLoading(true)

    const payload = {
      amount: parseFloat(amount),
      type,
      categoryId,
      date: date ? new Date(date) : new Date(),
      description: description || "",
    }

    try {
      let res
      if (isEdit && initialData) {
        res = await updateTransaction(initialData.id, payload)
      } else {
        res = await createTransaction(payload)
      }

      if (res.error) {
        setServerError(res.error)
      } else {
        setSuccess(isEdit ? "Transaction updated!" : "Transaction created!")
        if (!isEdit) {
          setAmount("")
          setDescription("")
          setCategoryId("")
          setDate(new Date().toISOString().split("T")[0])
          setType("EXPENSE")
        }
        router.refresh()
        onSuccess?.()
      }
    } catch {
      setServerError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
      <h3 className="text-lg font-bold text-gray-800">
        {isEdit ? "Edit Transaction" : "Add Transaction"}
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="INCOME"
              checked={type === "INCOME"}
              onChange={() => setType("INCOME")}
              className="text-green-600"
            />
            <span className="text-green-600 font-medium">Income</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="EXPENSE"
              checked={type === "EXPENSE"}
              onChange={() => setType("EXPENSE")}
              className="text-red-600"
            />
            <span className="text-red-600 font-medium">Expense</span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
        <input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className={`mt-1 block w-full rounded-md border p-2 ${errors.amount ? "border-red-500" : "border-gray-300"} focus:border-blue-500 focus:ring-blue-500`}
        />
        {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className={`mt-1 block w-full rounded-md border p-2 ${errors.categoryId ? "border-red-500" : "border-gray-300"} focus:border-blue-500 focus:ring-blue-500`}
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
        <input
          id="date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`mt-1 block w-full rounded-md border p-2 ${errors.date ? "border-red-500" : "border-gray-300"} focus:border-blue-500 focus:ring-blue-500`}
        />
        {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">{serverError}</div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-700 text-sm">{success}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? "Saving..." : isEdit ? "Update Transaction" : "Add Transaction"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}