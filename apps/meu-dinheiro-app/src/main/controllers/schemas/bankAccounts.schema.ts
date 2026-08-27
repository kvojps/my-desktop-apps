import { z } from 'zod';

export const createBankAccountSchema = z.object({
  name: z.string().min(1),
  balance: z.number().optional(),
});

export const updateBankAccountSchema = z.object({
  name: z.string().min(1).optional(),
  balance: z.number().optional(),
});
