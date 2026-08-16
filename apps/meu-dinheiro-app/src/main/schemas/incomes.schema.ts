import { z } from 'zod';

const bankAccountIdField = z.preprocess(
  (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
  z.number().int().positive().optional().nullable(),
);

export const createIncomeSchema = z.object({
  name: z.string().min(1),
  expectedDate: z.string().optional().nullable(),
  amount: z.number().optional(),
  bankAccountId: bankAccountIdField,
});

export const updateIncomeSchema = z.object({
  name: z.string().min(1).optional(),
  expectedDate: z.string().optional().nullable(),
  amount: z.number().optional(),
  notes: z.string().optional().nullable(),
  bankAccountId: bankAccountIdField,
});

export const receiveIncomeSchema = z.object({
  notes: z.string().optional().nullable(),
  receivedAt: z.string().optional(),
  bankAccountId: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().int().positive().optional(),
  ),
});
