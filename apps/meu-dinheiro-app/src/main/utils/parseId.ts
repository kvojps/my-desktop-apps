import { AppError } from '../errors/AppError';

export function parseId(raw: unknown): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'Invalid id');
  }
  return id;
}
