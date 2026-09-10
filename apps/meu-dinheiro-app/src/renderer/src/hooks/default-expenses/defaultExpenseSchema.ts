import { z } from 'zod';
import { optionalDayField, optionalNumberField } from '@/utils/formFields';

export const defaultExpenseFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  amount: optionalNumberField('Valor'),
  dueDay: optionalDayField('Dia de vencimento'),
  categoryId: z.string(),
});

export type DefaultExpenseFormValues = z.infer<typeof defaultExpenseFormSchema>;
