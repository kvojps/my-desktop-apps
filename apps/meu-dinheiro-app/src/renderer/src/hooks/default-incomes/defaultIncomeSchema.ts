import { z } from 'zod';
import { optionalDayField, optionalNumberField } from '@/utils/formFields';

export const defaultIncomeFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  amount: optionalNumberField('Valor'),
  expectedDay: optionalDayField('Dia previsto'),
  bankAccountId: z.string(),
});

export type DefaultIncomeFormValues = z.infer<typeof defaultIncomeFormSchema>;
