import { z } from 'zod';

export const githubTokenSchema = z
  .string()
  .trim()
  .min(8, 'Token muito curto')
  .refine((value) => !/\s/.test(value), { message: 'O token não pode conter espaços' });

/**
 * Só http/https saem para o navegador. Sem essa checagem, um `openExternal`
 * receberia qualquer esquema (`file:`, `javascript:`) e viraria um vetor para
 * executar coisas fora do app.
 */
export const externalUrlSchema = z
  .string()
  .trim()
  .min(1, 'URL é obrigatória')
  .refine(
    (value) => {
      try {
        const protocol = new URL(value).protocol;
        return protocol === 'http:' || protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Apenas URLs http(s) podem ser abertas' },
  );
