import { z } from 'zod';
import { optionalNumberField } from '@/utils/formFields';

export const bankAccountFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  balance: optionalNumberField('Saldo'),
});

export type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;
