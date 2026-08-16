import { z } from 'zod';

const bankAccountIdField = z.preprocess(
  (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
  z.number().int().positive().optional().nullable(),
);

export const createIncomeSchema = z.object({
  name: z.string().min(1),
  expected_date: z.string().optional().nullable(),
  amount: z.number().optional(),
  bank_account_id: bankAccountIdField,
});

export const updateIncomeSchema = z.object({
  name: z.string().min(1).optional(),
  expected_date: z.string().optional().nullable(),
  amount: z.number().optional(),
  notes: z.string().optional().nullable(),
  bank_account_id: bankAccountIdField,
});

export const receiveIncomeSchema = z.object({
  notes: z.string().optional().nullable(),
  received_at: z.string().optional(),
  bank_account_id: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().int().positive().optional(),
  ),
});
