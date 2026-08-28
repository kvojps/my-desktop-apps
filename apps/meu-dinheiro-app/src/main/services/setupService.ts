import type { MonthEntity } from '../domain/month';
import type { Repositories } from '../infra/database';
import { AppError } from '../utils/errors/AppError';
import { createMonthWithDefaults, currentCompetency, nextCompetency } from './monthsService';

/**
 * A configuração inicial: cria todo Mês da Competência escolhida até a corrente,
 * num `repos.transaction` só, pelo mesmo helper que o `monthsService` usa (spec
 * desta pasta, decisão 8). Recusa se já há Meses cadastrados.
 */
export function makeSetupService(repos: Repositories) {
  return {
    run(initialYear: number, initialMonth: number): MonthEntity[] {
      if (repos.months.latest()) {
        throw new AppError(
          400,
          'A configuração inicial já foi feita: já existem meses cadastrados.',
        );
      }

      const { year: currentYear, month: currentMonth } = currentCompetency();
      const created: MonthEntity[] = [];
      let year = initialYear;
      let month = initialMonth;

      return repos.transaction(() => {
        while (year < currentYear || (year === currentYear && month <= currentMonth)) {
          created.push(createMonthWithDefaults(repos, year, month));
          ({ year, month } = nextCompetency(year, month));
        }
        return created;
      });
    },
  };
}

export type SetupService = ReturnType<typeof makeSetupService>;
