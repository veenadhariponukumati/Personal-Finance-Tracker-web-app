import { z } from "zod"

export const TransactionTypeSchema = z.enum(["INCOME", "EXPENSE"])

export const CreateTransactionSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .transform((val) => Number(val.toFixed(2))),
  description: z.string().optional().or(z.literal("")),
  date: z.coerce.date().default(() => new Date()),
  type: TransactionTypeSchema,
  categoryId: z.string().min(1, "Category is required"),
})

export const UpdateTransactionSchema = CreateTransactionSchema.partial()

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>
