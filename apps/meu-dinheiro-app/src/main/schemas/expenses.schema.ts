import { z } from 'zod';

export const createExpenseSchema = z.object({
  name: z.string().min(1),
  dueDate: z.string().optional().nullable(),
  amount: z.number().optional(),
  categoryId: z.number().int().positive().optional().nullable(),
});

export const updateExpenseSchema = z.object({
  name: z.string().min(1).optional(),
  dueDate: z.string().optional().nullable(),
  amount: z.number().optional(),
  notes: z.string().optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
});

export const payExpenseSchema = z.object({
  notes: z.string().optional(),
  paidAt: z.string().optional(),
  bankAccountId: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().int().positive().optional(),
  ),
});
