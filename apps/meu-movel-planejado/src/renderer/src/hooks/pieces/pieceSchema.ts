import { z } from 'zod';
import { MAX_PIECE_LABEL_LENGTH } from '@shared/types/piece';
import { MAX_MEASURE_TENTHS_MM } from '@shared/types/rectangle';
import { measureFieldSchema, quantityFieldSchema } from '@/utils/measureFields';

/**
 * Mesmas regras do schema do main (`schemas/piece.schema.ts`), aqui para que o
 * erro apareça no campo em vez de voltar do IPC como snackbar. A validação do
 * main continua sendo a que vale.
 */
export const pieceFormSchema = z.object({
  label: z.string().trim().max(MAX_PIECE_LABEL_LENGTH, 'Rótulo muito longo'),
  length: measureFieldSchema({ label: 'Comprimento', max: MAX_MEASURE_TENTHS_MM }),
  width: measureFieldSchema({ label: 'Largura', max: MAX_MEASURE_TENTHS_MM }),
  quantity: quantityFieldSchema,
});

export type PieceFormValues = z.infer<typeof pieceFormSchema>;

/** Uma peça é o caso comum; a quantidade já vem preenchida para não ser digitada à toa. */
export const emptyPieceFormValues: PieceFormValues = {
  label: '',
  length: '',
  width: '',
  quantity: '1',
};
