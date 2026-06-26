"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

async function getSessionUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return { id: session.user.id }
}

export async function getDashboardSummary() {
  const user = await getSessionUser()
  if (!user) return { error: "Unauthorized" }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id }
    })

    let totalIncome = 0
    let totalExpenses = 0

    transactions.forEach(t => {
      const amount = Number(t.amount)
      if (t.type === "INCOME") {
        totalIncome += amount
      } else {
        totalExpenses += amount
      }
    })

    return {
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses
      }
    }
  } catch (error) {
    return { error: "Failed to fetch dashboard summary" }
  }
}

export async function getMonthlyData(year: number) {
  const user = await getSessionUser()
  if (!user) return { error: "Unauthorized" }

  try {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const monthlyMap: { [key: number]: { income: number, expense: number } } = {}
    for (let i = 0; i < 12; i++) {
      monthlyMap[i] = { income: 0, expense: 0 }
    }

    transactions.forEach(t => {
      const month = new Date(t.date).getMonth()
      const amount = Number(t.amount)
      if (t.type === "INCOME") {
        monthlyMap[month].income += amount
      } else {
        monthlyMap[month].expense += amount
      }
    })

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const data = monthNames.map((name, index) => ({
      month: name,
      income: monthlyMap[index].income,
      expense: monthlyMap[index].expense
    }))

    return { success: true, data }
  } catch (error) {
    return { error: "Failed to fetch monthly data" }
  }
}

export async function getCategories() {
  const user = await getSessionUser()
  if (!user) return { error: "Unauthorized" }

  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            transactions: {
              where: { userId: user.id }
            }
          }
        }
      }
    })

    return { success: true, data: categories }
  } catch (error) {
    return { error: "Failed to fetch categories" }
  }
}
