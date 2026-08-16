import { z } from 'zod';
import { parseOrThrow } from './validate';

const idSchema = z.string().min(1, 'Identificador inválido');

export function parseId(id: unknown): string {
  return parseOrThrow(idSchema, id);
}
