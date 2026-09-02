import { z } from 'zod';
import { MAX_MEASURE_TENTHS_MM } from '@shared/types/rectangle';
import { measureFieldSchema, quantityFieldSchema } from '@/utils/measureFields';

/**
 * Mesmas regras do schema do main (`schemas/sheets.schema.ts`). Sem rótulo:
 * retalho e chapa inteira são a mesma coisa, distinguida pelo tamanho.
 */
export const sheetFormSchema = z.object({
  length: measureFieldSchema({ label: 'Comprimento', max: MAX_MEASURE_TENTHS_MM }),
  width: measureFieldSchema({ label: 'Largura', max: MAX_MEASURE_TENTHS_MM }),
  quantity: quantityFieldSchema,
});

export type SheetFormValues = z.infer<typeof sheetFormSchema>;

export const emptySheetFormValues: SheetFormValues = {
  length: '',
  width: '',
  quantity: '1',
};
