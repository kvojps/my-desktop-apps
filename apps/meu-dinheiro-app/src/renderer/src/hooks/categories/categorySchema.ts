import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  color: z.string().min(1, 'Escolha uma cor'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
