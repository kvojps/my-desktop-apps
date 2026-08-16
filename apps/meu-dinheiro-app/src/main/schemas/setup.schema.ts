import { z } from 'zod';

export const setupSchema = z.object({
  initialMonth: z.number().int().min(1).max(12),
  initialYear: z.number().int(),
});
