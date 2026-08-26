import { z } from 'zod';

export const githubTokenSchema = z
  .string()
  .trim()
  .min(8, 'Token muito curto')
  .refine((value) => !/\s/.test(value), { message: 'O token não pode conter espaços' });
