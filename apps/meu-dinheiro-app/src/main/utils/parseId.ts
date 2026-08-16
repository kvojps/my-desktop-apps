import { z } from 'zod';
import { parseOrThrow } from './validate';

const idSchema = z.coerce.number().int('Identificador inválido').positive('Identificador inválido');

export function parseId(id: unknown): number {
  return parseOrThrow(idSchema, id);
}
