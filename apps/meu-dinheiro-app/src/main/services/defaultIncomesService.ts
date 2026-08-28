import type { DefaultIncomeEntity } from '../domain/defaultIncome';
import { formatDueDate } from '../domain/monthNames';
import type { Repositories } from '../infra/database';
import { AppError } from '../utils/errors/AppError';

export interface CreateDefaultIncomeInput {
  name: string;
  expectedDay?: number | null;
  amount?: number;
  bankAccountId?: number | null;
}

export type UpdateDefaultIncomeInput = Partial<CreateDefaultIncomeInput>;

/**
 * As Entradas padrão — o modelo do que se repete todo Mês. `create` propaga uma
 * cópia ("fotografia") para dentro de todo Mês já existente; `update`/`delete`
 * não propagam, porque os Meses já criados são fotografias (CONTEXT.md).
 */
export function makeDefaultIncomesService(repos: Repositories) {
  return {
    list(): DefaultIncomeEntity[] {
      return repos.defaultIncomes.list();
    },

    create(data: CreateDefaultIncomeInput): DefaultIncomeEntity {
      return repos.transaction(() => {
        const created = repos.defaultIncomes.create(data);

        for (const month of repos.months.listAll()) {
          repos.incomes.create(month.id, {
            name: data.name,
            expectedDate: formatDueDate(month.year, month.month, data.expectedDay),
            amount: data.amount ?? 0,
            bankAccountId: data.bankAccountId ?? null,
          });
        }

        return created;
      });
    },

    update(id: number, data: UpdateDefaultIncomeInput): DefaultIncomeEntity {
      const updated = repos.defaultIncomes.update(id, data);
      if (!updated) throw new AppError(404, 'Entrada padrão não encontrada');
      return updated;
    },

    delete(id: number): void {
      if (!repos.defaultIncomes.delete(id)) {
        throw new AppError(404, 'Entrada padrão não encontrada');
      }
    },
  };
}

export type DefaultIncomesService = ReturnType<typeof makeDefaultIncomesService>;
