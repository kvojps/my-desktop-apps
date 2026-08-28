import type { BankAccount } from '@shared/types/bank-account';
import type { BankAccountEntity } from '../../domain/bankAccount';

/**
 * `entity → response` de Conta bancária (README §2.5). `BankAccountEntity` e
 * `BankAccount` são idênticas hoje; o mapper é a trava que impede um campo novo
 * da entidade de chegar ao renderer sem alguém decidir que chega.
 */
export function bankAccountToResponse(entity: BankAccountEntity): BankAccount {
  return {
    id: entity.id,
    name: entity.name,
    balance: entity.balance,
    createdAt: entity.createdAt,
  };
}
