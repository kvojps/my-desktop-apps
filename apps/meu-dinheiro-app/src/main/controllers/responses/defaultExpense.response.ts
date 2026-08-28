import type { DefaultExpense } from '@shared/types/expense';
import type { DefaultExpenseEntity } from '../../domain/defaultExpense';

/**
 * `entity → response` de Despesa padrão (README §2.5). O critério de por que o
 * mapper existe mesmo trivial, e de por que `categoryName` / `categoryColor` só
 * entram quando vieram do JOIN, está no cabeçalho de `expense.response.ts`.
 */
export function defaultExpenseToResponse(entity: DefaultExpenseEntity): DefaultExpense {
  return {
    id: entity.id,
    name: entity.name,
    dueDay: entity.dueDay,
    amount: entity.amount,
    categoryId: entity.categoryId,
    createdAt: entity.createdAt,
    ...(entity.categoryName === undefined ? {} : { categoryName: entity.categoryName }),
    ...(entity.categoryColor === undefined ? {} : { categoryColor: entity.categoryColor }),
  };
}
