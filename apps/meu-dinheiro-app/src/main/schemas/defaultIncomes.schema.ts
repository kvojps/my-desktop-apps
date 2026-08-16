import { z } from 'zod';

const bankAccountIdField = z.preprocess(
  (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
  z.number().int().positive().optional().nullable(),
);

export const createDefaultIncomeSchema = z.object({
  name: z.string().min(1),
  expectedDay: z.number().int().min(1).max(31).optional().nullable(),
  amount: z.number().optional(),
  bankAccountId: bankAccountIdField,
});

export const updateDefaultIncomeSchema = z.object({
  name: z.string().min(1).optional(),
  expectedDay: z.number().int().min(1).max(31).optional().nullable(),
  amount: z.number().optional(),
  bankAccountId: bankAccountIdField,
});
