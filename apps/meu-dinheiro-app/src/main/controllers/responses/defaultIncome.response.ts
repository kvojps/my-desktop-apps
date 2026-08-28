import type { DefaultIncome } from '@shared/types/income';
import type { DefaultIncomeEntity } from '../../domain/defaultIncome';

/**
 * `entity → response` de Entrada padrão (README §2.5). O critério de por que o
 * mapper existe mesmo trivial, e de por que `bankAccountName` só entra quando
 * veio do JOIN, está no cabeçalho de `expense.response.ts`.
 */
export function defaultIncomeToResponse(entity: DefaultIncomeEntity): DefaultIncome {
  return {
    id: entity.id,
    name: entity.name,
    expectedDay: entity.expectedDay,
    amount: entity.amount,
    bankAccountId: entity.bankAccountId,
    createdAt: entity.createdAt,
    ...(entity.bankAccountName === undefined ? {} : { bankAccountName: entity.bankAccountName }),
  };
}
