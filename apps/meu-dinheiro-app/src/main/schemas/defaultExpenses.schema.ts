import { z } from 'zod';

export const createDefaultExpenseSchema = z.object({
  name: z.string().min(1),
  due_day: z.number().int().min(1).max(31).optional().nullable(),
  amount: z.number().optional(),
  category_id: z.number().int().positive().optional().nullable(),
});

export const updateDefaultExpenseSchema = z.object({
  name: z.string().min(1).optional(),
  due_day: z.number().int().min(1).max(31).optional().nullable(),
  amount: z.number().optional(),
  category_id: z.number().int().positive().optional().nullable(),
});
