import { z } from 'zod';

/**
 * O nome do comprovante que o renderer manda abrir. Hoje a string crua chega ao
 * `shell.openPath` sem conferência: um `..` ou uma barra no meio abririam um
 * arquivo fora do diretório de uploads. Recusa exatamente a superfície da
 * decisão 14a da spec — caminho relativo, `..`, separadores —, e nada além
 * disso: um nome de arquivo simples passa.
 */
export const receiptFilenameSchema = z
  .string()
  .min(1, 'Comprovante inválido')
  .refine(
    (name) =>
      !name.includes('/') && !name.includes('\\') && !name.includes('..') && name !== '.',
    'Comprovante inválido',
  );
