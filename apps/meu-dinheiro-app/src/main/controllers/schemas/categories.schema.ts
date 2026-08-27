import { z } from 'zod';

const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida');

export const createCategorySchema = z.object({
  name: z.string().min(1),
  color: colorSchema,
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  color: colorSchema.optional(),
});
