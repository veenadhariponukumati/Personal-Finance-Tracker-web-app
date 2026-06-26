"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { TransactionForm } from "@/components/forms/transaction-form"
import { SuccessToast } from "@/components/ui/success-toast"
import { LoadingSpinner } from "@/components/ui/loading"
import { ErrorBanner } from "@/components/ui/error-banner"
import { getTransactionById } from "@/actions/transactions"

export default function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [success, setSuccess] = useState<string | null>(null)
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch on mount
  useState(() => {
    getTransactionById(id).then((res) => {
      setLoading(false)
      if (res.success && res.data) setTransaction(res.data)
      else setError(res.error ?? "Transaction not found")
    })
  })

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorBanner message={error} onRetryLabel="Go back" onClose={() => router.push("/transactions")} />
  if (!transaction) return <ErrorBanner message="Transaction not found" onRetryLabel="Back" onClose={() => router.push("/transactions")} />

  return (
    <div className="max-w-lg mx-auto">
      {success && <SuccessToast message={success} onClose={() => router.push("/transactions")} />}
      <TransactionForm
        initialData={transaction}
        onSuccess={() => setSuccess("Transaction updated!")}
        onCancel={() => router.push("/transactions")}
      />
    </div>
  )
}