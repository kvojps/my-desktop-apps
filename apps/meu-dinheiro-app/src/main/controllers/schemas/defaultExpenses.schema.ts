import { z } from 'zod';

export const createDefaultExpenseSchema = z.object({
  name: z.string().min(1),
  dueDay: z.number().int().min(1).max(31).optional().nullable(),
  amount: z.number().optional(),
  categoryId: z.number().int().positive().optional().nullable(),
});

export const updateDefaultExpenseSchema = z.object({
  name: z.string().min(1).optional(),
  dueDay: z.number().int().min(1).max(31).optional().nullable(),
  amount: z.number().optional(),
  categoryId: z.number().int().positive().optional().nullable(),
});
