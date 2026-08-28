import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { CategoryTotal } from '@shared/types/category';
import type { ReportsService } from '../services/reportsService';
import { parseId } from '../utils/parseId';
import { handle } from './handle';
import { categoryTotalToResponse } from './responses/category.response';

/**
 * O relatório da tela de Histórico: quanto foi gasto por Categoria num ano. Um
 * canal só, e mesmo assim controller próprio — o SQL `GROUP BY categoria` é um
 * `reportsService` à parte (spec, decisão 9). `parseId` na entrada,
 * `categoryTotalToResponse` na saída.
 */
export function registerReportsController(reports: ReportsService): void {
  handle(IPC_CHANNELS.reportsCategoryTotalsForYear, (_event, year: unknown): CategoryTotal[] =>
    reports.categoryTotalsForYear(parseId(year)).map(categoryTotalToResponse),
  );
}
