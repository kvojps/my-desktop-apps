import { z } from 'zod';

const optionalNumberField = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || !Number.isNaN(Number(v)), `${label} inválido`);

export const expenseFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  amount: optionalNumberField('Valor'),
  dueDate: z.string(),
  notes: z.string(),
  categoryId: z.string(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const incomeFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  amount: optionalNumberField('Valor'),
  expectedDate: z.string(),
  bankAccountId: z.string(),
  notes: z.string(),
});

export type IncomeFormValues = z.infer<typeof incomeFormSchema>;

export const payFormSchema = z.object({
  paidAt: z.string(),
  bankAccountId: z.string(),
  notes: z.string(),
});

export type PayFormValues = z.infer<typeof payFormSchema>;

export const receiveFormSchema = z.object({
  receivedAt: z.string(),
  bankAccountId: z.string(),
  notes: z.string(),
});

export type ReceiveFormValues = z.infer<typeof receiveFormSchema>;
