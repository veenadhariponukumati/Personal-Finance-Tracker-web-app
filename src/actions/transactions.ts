"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { CreateTransactionSchema, UpdateTransactionSchema } from "@/schemas/transaction"
import { revalidatePath } from "next/cache"

async function getSessionUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return { id: session.user.id }
}

export async function createTransaction(values: unknown) {
  const user = await getSessionUser()
  if (!user) return { error: "Unauthorized" }

  const validatedFields = CreateTransactionSchema.safeParse(values)
  if (!validatedFields.success) {
    return { error: "Invalid fields!" }
  }

  try {
    const transaction = await prisma.transaction.create({
      data: {
        ...validatedFields.data,
        userId: user.id,
      }
    })

    revalidatePath("/dashboard")
    revalidatePath("/transactions")
    return { success: "Transaction created!", data: { ...transaction, amount: Number(transaction.amount) } }
  } catch (error) {
    return { error: "Failed to create transaction" }
  }
}

export async function getTransactions(filters?: { categoryId?: string, month?: number, year?: number }) {
  const user = await getSessionUser()
  if (!user) return { error: "Unauthorized" }

  const { categoryId, month, year } = filters || {}

  let where: any = { userId: user.id }

  if (categoryId) {
    where.categoryId = categoryId
  }

  if (month !== undefined || year !== undefined) {
    const now = new Date()
    const targetYear = year ?? now.getFullYear()
    const targetMonth = month ?? now.getMonth() // 0-indexed

    const startDate = new Date(targetYear, targetMonth, 1)
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999)

    where.date = {
      gte: startDate,
      lte: endDate,
    }
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" }
    })

    return { 
      success: true, 
      data: transactions.map(t => ({ ...t, amount: Number(t.amount) })) 
    }
  } catch (error) {
    return { error: "Failed to fetch transactions" }
  }
}

export async function getTransactionById(id: string) {
  const user = await getSessionUser()
  if (!user) return { error: "Unauthorized" }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id, userId: user.id },
      include: { category: true }
    })

    if (!transaction) return { error: "Transaction not found" }

    return { success: true, data: { ...transaction, amount: Number(transaction.amount) } }
  } catch (error) {
    return { error: "Failed to fetch transaction" }
  }
}

export async function updateTransaction(id: string, values: unknown) {
  const user = await getSessionUser()
  if (!user) return { error: "Unauthorized" }

  const validatedFields = UpdateTransactionSchema.safeParse(values)
  if (!validatedFields.success) {
    return { error: "Invalid fields!" }
  }

  try {
    const existing = await prisma.transaction.findUnique({
      where: { id, userId: user.id }
    })

    if (!existing) return { error: "Transaction not found" }

    const updated = await prisma.transaction.update({
      where: { id },
      data: validatedFields.data
    })

    revalidatePath("/dashboard")
    revalidatePath("/transactions")
    return { success: "Transaction updated!", data: { ...updated, amount: Number(updated.amount) } }
  } catch (error) {
    return { error: "Failed to update transaction" }
  }
}

export async function deleteTransaction(id: string) {
  const user = await getSessionUser()
  if (!user) return { error: "Unauthorized" }

  try {
    const existing = await prisma.transaction.findUnique({
      where: { id, userId: user.id }
    })

    if (!existing) return { error: "Transaction not found" }

    await prisma.transaction.delete({
      where: { id }
    })

    revalidatePath("/dashboard")
    revalidatePath("/transactions")
    return { success: "Transaction deleted!" }
  } catch (error) {
    return { error: "Failed to delete transaction" }
  }
}
