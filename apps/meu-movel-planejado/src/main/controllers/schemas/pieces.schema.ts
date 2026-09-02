import { z } from 'zod';
import { MAX_PIECE_LABEL_LENGTH } from '@shared/types/piece';
import { measureSchema, quantitySchema } from './rectangle.schema';

/**
 * O rótulo é opcional para o usuário e obrigatório no tipo: ausência vira
 * string vazia aqui, na fronteira, para que nenhuma leitura precise decidir de
 * novo o que fazer com ela.
 */
export const pieceInputSchema = z.object({
  label: z.string().trim().max(MAX_PIECE_LABEL_LENGTH, 'Rótulo muito longo'),
  lengthTenthsMm: measureSchema('Comprimento'),
  widthTenthsMm: measureSchema('Largura'),
  quantity: quantitySchema,
});
