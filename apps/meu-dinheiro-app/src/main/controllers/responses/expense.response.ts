import type { Expense } from '@shared/types/expense';
import type { ExpenseEntity } from '../../domain/expense';

/**
 * `entity → response` de Despesa (README §2.5). `ExpenseEntity` e `Expense` são
 * idênticas hoje, e é por isso que o mapper precisa existir: sem ele a entidade
 * atravessaria o IPC por identidade estrutural, e um campo novo chegaria ao
 * renderer sem que ninguém tivesse decidido que chega.
 *
 * `bankAccountName` / `categoryName` / `categoryColor` vêm de um JOIN e não
 * existem na chave quando a consulta não o faz — só entram no response quando de
 * fato vieram, para "sem JOIN" seguir sendo a ausência do campo e não um campo
 * com `undefined` dentro (o structured clone do IPC preserva a diferença).
 */
export function expenseToResponse(entity: ExpenseEntity): Expense {
  return {
    id: entity.id,
    monthId: entity.monthId,
    name: entity.name,
    dueDate: entity.dueDate,
    amount: entity.amount,
    isPaid: entity.isPaid,
    paidAt: entity.paidAt,
    receipt: entity.receipt,
    notes: entity.notes,
    bankAccountId: entity.bankAccountId,
    categoryId: entity.categoryId,
    createdAt: entity.createdAt,
    ...(entity.bankAccountName === undefined ? {} : { bankAccountName: entity.bankAccountName }),
    ...(entity.categoryName === undefined ? {} : { categoryName: entity.categoryName }),
    ...(entity.categoryColor === undefined ? {} : { categoryColor: entity.categoryColor }),
  };
}
