import { z } from 'zod';

const bankAccountIdField = z.preprocess(
  (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
  z.number().int().positive().optional().nullable(),
);

export const createDefaultIncomeSchema = z.object({
  name: z.string().min(1),
  expected_day: z.number().int().min(1).max(31).optional().nullable(),
  amount: z.number().optional(),
  bank_account_id: bankAccountIdField,
});

export const updateDefaultIncomeSchema = z.object({
  name: z.string().min(1).optional(),
  expected_day: z.number().int().min(1).max(31).optional().nullable(),
  amount: z.number().optional(),
  bank_account_id: bankAccountIdField,
});
