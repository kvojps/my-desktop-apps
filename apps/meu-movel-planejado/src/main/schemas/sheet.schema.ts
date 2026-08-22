import { z } from 'zod';
import { measureSchema, quantitySchema } from './rectangle.schema';

/**
 * Chapa não tem rótulo: retalho e chapa inteira são a mesma coisa distinguida
 * pelo tamanho, e nomeá-los seria inventar uma distinção que o modelo não tem.
 */
export const sheetInputSchema = z.object({
  lengthTenthsMm: measureSchema('Comprimento'),
  widthTenthsMm: measureSchema('Largura'),
  quantity: quantitySchema,
});
