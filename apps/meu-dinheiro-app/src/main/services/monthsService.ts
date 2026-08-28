import type { MonthDetailEntity, MonthEntity } from '../domain/month';
import { formatDueDate, monthLabel } from '../domain/monthNames';
import type { Repositories } from '../infra/database';
import { AppError } from '../utils/errors/AppError';

/**
 * Última Competência (AAAA-MM) que o app já tratou como "Mês corrente". Enquanto
 * a marca for a Competência de hoje, o Mês corrente não é recriado — é o que faz
 * uma exclusão intencional ser respeitada. O `backupService` a apaga no
 * pós-import, para o conjunto de dados novo ganhar o seu Mês corrente.
 */
export const LAST_CURRENT_MONTH_KEY = 'last_current_month';

/** A Competência de hoje. Representada como `AAAA-MM` onde é preciso uma string. */
export function currentCompetency(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function competencyKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** A Competência seguinte, com o rollover Dez→Jan. */
export function nextCompetency(year: number, month: number): { year: number; month: number } {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

function rememberCurrentCompetency(repos: Repositories, year: number, month: number): void {
  const current = currentCompetency();
  if (year === current.year && month === current.month) {
    repos.appSettings.setAppSetting(LAST_CURRENT_MONTH_KEY, competencyKey(year, month));
  }
}

/**
 * Insere o Mês e a cópia ("fotografia") de cada Despesa/Entrada padrão vigente,
 * com `formatDueDate` de `domain/`.
 *
 * **Não abre `repos.transaction`** — quem abre é `create`, `createBatch`,
 * `ensureCurrentMonth` e `setupService.run`, uma vez cada. É o que evita
 * transação aninhada no lote e no setup (spec desta pasta, decisão 8).
 */
export function createMonthWithDefaults(
  repos: Repositories,
  year: number,
  month: number,
): MonthEntity {
  const created = repos.months.create(year, month);

  for (const model of repos.defaultExpenses.list()) {
    repos.expenses.create(created.id, {
      name: model.name,
      dueDate: formatDueDate(year, month, model.dueDay),
      amount: model.amount,
      categoryId: model.categoryId,
    });
  }

  for (const model of repos.defaultIncomes.list()) {
    repos.incomes.create(created.id, {
      name: model.name,
      expectedDate: formatDueDate(year, month, model.expectedDay),
      amount: model.amount,
      bankAccountId: model.bankAccountId,
    });
  }

  rememberCurrentCompetency(repos, year, month);
  return created;
}

/**
 * O Mês e o seu ciclo de vida: a Competência, o rollover Dez→Jan, a cópia dos
 * padrões e a idempotência do Mês corrente — regra que morava espalhada por
 * `monthsRepository.ts` misturada com SQL.
 */
export function makeMonthsService(repos: Repositories) {
  function create(year: number, month: number): MonthEntity {
    if (repos.months.findByCompetency(year, month)) {
      throw new AppError(400, 'Esse mês já existe');
    }
    return repos.transaction(() => createMonthWithDefaults(repos, year, month));
  }

  return {
    /** O agregado de Realizado/Previsto por Mês fica no SQL de `repos.months.list()`. */
    list(): MonthEntity[] {
      return repos.months.list();
    },

    getDetail(id: number): MonthDetailEntity {
      const detail = repos.months.findById(id);
      if (!detail) throw new AppError(404, 'Mês não encontrado');
      return detail;
    },

    create,

    /**
     * O Mês seguinte ao último, com rollover Dez→Jan. `AppError(400)` quando não
     * há nenhum ainda; a criação em si delega a `create`.
     */
    createNext(): MonthEntity {
      const last = repos.months.latest();
      if (!last) {
        throw new AppError(400, 'Nenhum mês existe ainda. Cadastre o primeiro nas Configurações.');
      }

      const { year, month } = nextCompetency(last.year, last.month);
      return create(year, month);
    },

    /**
     * Lote de competência com rollover Dez→Jan, num `repos.transaction` só,
     * chamando o helper por Mês. `≤ 60` é garantido pelo schema (ticket 06); um
     * Mês existente vai para `errors`, sem falhar o lote.
     */
    createBatch(
      fromYear: number,
      fromMonth: number,
      toYear: number,
      toMonth: number,
    ): { created: MonthEntity[]; errors: string[] } {
      const created: MonthEntity[] = [];
      const errors: string[] = [];

      return repos.transaction(() => {
        let year = fromYear;
        let month = fromMonth;

        while (year < toYear || (year === toYear && month <= toMonth)) {
          if (repos.months.findByCompetency(year, month)) {
            errors.push(`${monthLabel(year, month)} já existe`);
          } else {
            created.push(createMonthWithDefaults(repos, year, month));
          }

          ({ year, month } = nextCompetency(year, month));
        }

        return { created, errors };
      });
    },

    /**
     * Idempotência por Competência via `repos.appSettings`: devolve `null` se a
     * Competência de hoje já foi tratada ou o Mês já existe; senão cria e
     * devolve. Chamada pelo `index.ts` no boot e no `browser-window-focus`.
     */
    ensureCurrentMonth(): MonthEntity | null {
      const { year, month } = currentCompetency();
      const key = competencyKey(year, month);

      if (repos.appSettings.getAppSetting(LAST_CURRENT_MONTH_KEY) === key) return null;

      if (repos.months.findByCompetency(year, month)) {
        repos.appSettings.setAppSetting(LAST_CURRENT_MONTH_KEY, key);
        return null;
      }

      return repos.transaction(() => createMonthWithDefaults(repos, year, month));
    },

    delete(id: number): MonthEntity {
      const deleted = repos.months.delete(id);
      if (!deleted) throw new AppError(404, 'Mês não encontrado');

      // Exclusão do Mês corrente é intencional: marca a Competência para o boot
      // seguinte não recriá-la de propósito.
      rememberCurrentCompetency(repos, deleted.year, deleted.month);
      return deleted;
    },
  };
}

export type MonthsService = ReturnType<typeof makeMonthsService>;
