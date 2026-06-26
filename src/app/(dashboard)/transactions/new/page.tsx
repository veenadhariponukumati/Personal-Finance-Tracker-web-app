"use client"

import { useRouter } from "next/navigation"
import { TransactionForm } from "@/components/forms/transaction-form"
import { SuccessToast } from "@/components/ui/success-toast"
import { useState, useEffect } from "react"
import { getCategories } from "@/actions/dashboard"
import { LoadingSpinner } from "@/components/ui/loading"

export default function NewTransactionPage() {
  const router = useRouter()
  const [success, setSuccess] = useState<string | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategories().then((res) => {
      if (res.success && res.data) setCategories(res.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-lg mx-auto">
      {success && <SuccessToast message={success} onClose={() => router.push("/transactions")} />}
      <TransactionForm
        categories={categories}
        onSuccess={() => setSuccess("Transaction created!")}
        onCancel={() => router.push("/transactions")}
      />
    </div>
  )
}