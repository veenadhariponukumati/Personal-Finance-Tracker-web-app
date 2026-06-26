"use client"

import { useRouter } from "next/navigation"
import { TransactionForm } from "@/components/forms/transaction-form"
import { SuccessToast } from "@/components/ui/success-toast"
import { useState } from "react"

export default function NewTransactionPage() {
  const router = useRouter()
  const [success, setSuccess] = useState<string | null>(null)

  return (
    <div className="max-w-lg mx-auto">
      {success && <SuccessToast message={success} onClose={() => router.push("/transactions")} />}
      <TransactionForm
        onSuccess={() => setSuccess("Transaction created!")}
        onCancel={() => router.push("/transactions")}
      />
    </div>
  )
}