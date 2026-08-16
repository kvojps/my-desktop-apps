import { z } from 'zod';

export const createMonthSchema = z.object({
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
});

export const MAX_BATCH_MONTHS = 60;

export const createMonthsBatchSchema = z
  .object({
    fromYear: z.number().int(),
    fromMonth: z.number().int().min(1).max(12),
    toYear: z.number().int(),
    toMonth: z.number().int().min(1).max(12),
  })
  .refine((data) => data.toYear * 12 + data.toMonth >= data.fromYear * 12 + data.fromMonth, {
    message: 'A data final deve ser igual ou posterior à data inicial',
  })
  .refine(
    (data) =>
      data.toYear * 12 + data.toMonth - (data.fromYear * 12 + data.fromMonth) + 1 <=
      MAX_BATCH_MONTHS,
    { message: `O intervalo não pode ultrapassar ${MAX_BATCH_MONTHS} meses` },
  );
