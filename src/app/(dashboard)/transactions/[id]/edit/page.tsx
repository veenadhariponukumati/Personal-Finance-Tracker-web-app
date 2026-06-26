"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TransactionForm } from "@/components/forms/transaction-form"
import { SuccessToast } from "@/components/ui/success-toast"
import { LoadingSpinner } from "@/components/ui/loading"
import { ErrorBanner } from "@/components/ui/error-banner"
import { getTransactionById } from "@/actions/transactions"
import { getCategories } from "@/actions/dashboard"

export default function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [success, setSuccess] = useState<string | null>(null)
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    Promise.all([
      getTransactionById(id),
      getCategories()
    ]).then(([txnRes, catRes]) => {
      setLoading(false)
      if (txnRes.success && txnRes.data) setTransaction(txnRes.data)
      else setError(txnRes.error ?? "Transaction not found")
      if (catRes.success && catRes.data) setCategories(catRes.data)
    })
  }, [id])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorBanner message={error} onRetryLabel="Go back" onClose={() => router.push("/transactions")} />
  if (!transaction) return <ErrorBanner message="Transaction not found" onRetryLabel="Back" onClose={() => router.push("/transactions")} />

  return (
    <div className="max-w-lg mx-auto">
      {success && <SuccessToast message={success} onClose={() => router.push("/transactions")} />}
      <TransactionForm
        initialData={transaction}
        categories={categories}
        onSuccess={() => setSuccess("Transaction updated!")}
        onCancel={() => router.push("/transactions")}
      />
    </div>
  )
}