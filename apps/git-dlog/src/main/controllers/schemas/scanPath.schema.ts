import { z } from 'zod';

/**
 * Só a forma. "Esse diretório existe?" é regra, e é do `scanPathsService`, que
 * pergunta ao gateway de sistema de arquivos — um schema que chama `node:fs` é
 * validação de entrada fazendo I/O.
 */
export const createScanPathSchema = z.string().trim().min(1, 'Caminho é obrigatório');
