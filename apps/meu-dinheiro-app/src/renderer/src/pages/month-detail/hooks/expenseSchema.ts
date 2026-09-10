import { z } from 'zod';
import { optionalNumberField } from '@/utils/formFields';

export const expenseFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  amount: optionalNumberField('Valor'),
  dueDate: z.string(),
  notes: z.string(),
  categoryId: z.string(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const payFormSchema = z.object({
  paidAt: z.string(),
  bankAccountId: z.string(),
  notes: z.string(),
});

export type PayFormValues = z.infer<typeof payFormSchema>;
