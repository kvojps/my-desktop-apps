import { z } from 'zod';

export const companySettingsSchema = z.object({
  name: z.string(),
  cnpj: z.string(),
  phone: z.string(),
  address: z.string(),
});
