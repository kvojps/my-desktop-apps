import { z } from 'zod';

/**
 * Lista opcional de repositórios a atualizar. Os caminhos ainda são conferidos
 * contra os repositórios realmente encontrados nos diretórios cadastrados —
 * o app nunca roda git num diretório que não veio da própria varredura.
 */
export const fetchReposSchema = z.array(z.string().min(1)).nullish();
