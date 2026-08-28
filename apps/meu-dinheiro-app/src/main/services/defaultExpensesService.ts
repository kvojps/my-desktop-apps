import type { DefaultExpenseEntity } from '../domain/defaultExpense';
import { formatDueDate } from '../domain/monthNames';
import type { Repositories } from '../infra/database';
import { AppError } from '../utils/errors/AppError';

export interface CreateDefaultExpenseInput {
  name: string;
  dueDay?: number | null;
  amount?: number;
  categoryId?: number | null;
}

export type UpdateDefaultExpenseInput = Partial<CreateDefaultExpenseInput>;

/**
 * As Despesas padrão — o modelo do que se repete todo Mês. `create` propaga uma
 * cópia ("fotografia") para dentro de todo Mês já existente; `update`/`delete`
 * não propagam, porque os Meses já criados são fotografias (CONTEXT.md).
 */
export function makeDefaultExpensesService(repos: Repositories) {
  return {
    list(): DefaultExpenseEntity[] {
      return repos.defaultExpenses.list();
    },

    create(data: CreateDefaultExpenseInput): DefaultExpenseEntity {
      return repos.transaction(() => {
        const created = repos.defaultExpenses.create(data);

        for (const month of repos.months.listAll()) {
          repos.expenses.create(month.id, {
            name: data.name,
            dueDate: formatDueDate(month.year, month.month, data.dueDay),
            amount: data.amount ?? 0,
            categoryId: data.categoryId ?? null,
          });
        }

        return created;
      });
    },

    update(id: number, data: UpdateDefaultExpenseInput): DefaultExpenseEntity {
      const updated = repos.defaultExpenses.update(id, data);
      if (!updated) throw new AppError(404, 'Despesa padrão não encontrada');
      return updated;
    },

    delete(id: number): void {
      if (!repos.defaultExpenses.delete(id)) {
        throw new AppError(404, 'Despesa padrão não encontrada');
      }
    },
  };
}

export type DefaultExpensesService = ReturnType<typeof makeDefaultExpensesService>;
