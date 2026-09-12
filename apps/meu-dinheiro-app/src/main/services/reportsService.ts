import type { CategoryTotal } from '@shared/types/category';
import type { Repositories } from '../infra/database';

/**
 * O relatório da tela de Histórico. O SQL `GROUP BY categoria` é método do
 * `categoriesRepository` (spec desta pasta, decisão 9); o service repassa.
 */
export function makeReportsService(repos: Repositories) {
  return {
    categoryTotalsForYear(year: number): CategoryTotal[] {
      return repos.categories.totalsForYear(year);
    },
  };
}

export type ReportsService = ReturnType<typeof makeReportsService>;
