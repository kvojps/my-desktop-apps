import type { Income } from '@shared/types/income';
import type { IncomeEntity } from '../../domain/income';

/**
 * `entity → response` de Entrada (README §2.5). O critério de por que o mapper
 * existe mesmo trivial, e de por que `bankAccountName` só entra quando veio do
 * JOIN, está no cabeçalho de `expense.response.ts`.
 */
export function incomeToResponse(entity: IncomeEntity): Income {
  return {
    id: entity.id,
    monthId: entity.monthId,
    name: entity.name,
    expectedDate: entity.expectedDate,
    amount: entity.amount,
    isReceived: entity.isReceived,
    receivedAt: entity.receivedAt,
    notes: entity.notes,
    bankAccountId: entity.bankAccountId,
    createdAt: entity.createdAt,
    ...(entity.bankAccountName === undefined ? {} : { bankAccountName: entity.bankAccountName }),
  };
}
