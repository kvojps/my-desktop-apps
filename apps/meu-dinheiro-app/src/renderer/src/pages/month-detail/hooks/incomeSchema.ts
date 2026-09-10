import { z } from 'zod';
import { optionalNumberField } from '@/utils/formFields';

export const incomeFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  amount: optionalNumberField('Valor'),
  expectedDate: z.string(),
  bankAccountId: z.string(),
  notes: z.string(),
});

export type IncomeFormValues = z.infer<typeof incomeFormSchema>;

export const receiveFormSchema = z.object({
  receivedAt: z.string(),
  bankAccountId: z.string(),
  notes: z.string(),
});

export type ReceiveFormValues = z.infer<typeof receiveFormSchema>;
