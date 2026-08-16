import { ZodType } from 'zod';
import { AppError } from '../errors/AppError';

export function parseOrThrow<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(400, result.error.issues.map((issue) => issue.message).join('; '));
  }
  return result.data;
}
