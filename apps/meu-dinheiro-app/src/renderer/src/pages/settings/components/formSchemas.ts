import { z } from 'zod';

const optionalNumberField = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || !Number.isNaN(Number(v)), `${label} inválido`);

const optionalDayField = (label: string) =>
  z
    .string()
    .trim()
    .refine(
      (v) => v === '' || (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 31),
      `${label} deve ser um dia entre 1 e 31`,
    );

export const bankAccountFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  balance: optionalNumberField('Saldo'),
});

export type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;

export const defaultExpenseFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  amount: optionalNumberField('Valor'),
  dueDay: optionalDayField('Dia de vencimento'),
  categoryId: z.string(),
});

export type DefaultExpenseFormValues = z.infer<typeof defaultExpenseFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  color: z.string().min(1, 'Escolha uma cor'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const defaultIncomeFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  amount: optionalNumberField('Valor'),
  expectedDay: optionalDayField('Dia previsto'),
  bankAccountId: z.string(),
});

export type DefaultIncomeFormValues = z.infer<typeof defaultIncomeFormSchema>;
