import { z } from 'zod';

export const createExpenseSchema = z.object({
  name: z.string().min(1),
  due_date: z.string().optional().nullable(),
  amount: z.number().optional(),
  category_id: z.number().int().positive().optional().nullable(),
});

export const updateExpenseSchema = z.object({
  name: z.string().min(1).optional(),
  due_date: z.string().optional().nullable(),
  amount: z.number().optional(),
  notes: z.string().optional().nullable(),
  category_id: z.number().int().positive().optional().nullable(),
});

export const payExpenseSchema = z.object({
  notes: z.string().optional(),
  paid_at: z.string().optional(),
  bank_account_id: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().int().positive().optional(),
  ),
});
