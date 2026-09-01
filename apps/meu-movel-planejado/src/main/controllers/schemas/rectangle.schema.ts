import { z } from 'zod';
import {
  MAX_MEASURE_TENTHS_MM,
  MAX_QUANTITY,
  MIN_MEASURE_TENTHS_MM,
} from '@shared/types/rectangle';
import { tenthsToMillimeters } from '@shared/units/measure';

/**
 * O que atravessa o IPC já é décimo de milímetro inteiro — milímetro existe só
 * na digitação e na tela. Um `1850.5` chegando aqui significa que alguém
 * converteu no lugar errado, e é isso que `int()` barra.
 *
 * As mensagens falam em milímetro, porque é a unidade que o usuário vê: dizer
 * "no máximo 100000" para quem digitou 12000 mm não explicaria nada.
 */
export function measureSchema(field: string) {
  return z
    .number()
    .int(`${field} precisa ser uma medida válida`)
    .min(MIN_MEASURE_TENTHS_MM, `${field} precisa ser maior que zero`)
    .max(
      MAX_MEASURE_TENTHS_MM,
      `${field} não pode passar de ${tenthsToMillimeters(MAX_MEASURE_TENTHS_MM)} mm`,
    );
}

export const quantitySchema = z
  .number()
  .int('Quantidade precisa ser um número inteiro')
  .min(1, 'Quantidade precisa ser pelo menos 1')
  .max(MAX_QUANTITY, `Quantidade não pode passar de ${MAX_QUANTITY}`);
