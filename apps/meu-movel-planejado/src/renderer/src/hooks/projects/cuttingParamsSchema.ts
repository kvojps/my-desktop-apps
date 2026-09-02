import { z } from 'zod';
import { MAX_KERF_TENTHS_MM, MAX_TRIM_TENTHS_MM } from '@shared/types/project';
import { measureFieldSchema } from '@/utils/measureFields';

/**
 * Mesmas regras do schema do main (`schemas/projects.schema.ts`). Os dois campos
 * aceitam zero: kerf zero é o corte ideal com que se confere a conta, e refile
 * zero é o default — nem toda oficina refila.
 */
export const cuttingParamsFormSchema = z.object({
  kerf: measureFieldSchema({ label: 'Kerf', max: MAX_KERF_TENTHS_MM, allowZero: true }),
  trim: measureFieldSchema({ label: 'Refile', max: MAX_TRIM_TENTHS_MM, allowZero: true }),
});

export type CuttingParamsFormValues = z.infer<typeof cuttingParamsFormSchema>;
