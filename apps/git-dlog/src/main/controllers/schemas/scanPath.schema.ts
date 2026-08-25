import fs from 'node:fs';
import { z } from 'zod';

export const createScanPathSchema = z
  .string()
  .trim()
  .min(1, 'Caminho é obrigatório')
  .refine((value) => fs.existsSync(value) && fs.statSync(value).isDirectory(), {
    message: 'O caminho informado não existe ou não é um diretório',
  });
