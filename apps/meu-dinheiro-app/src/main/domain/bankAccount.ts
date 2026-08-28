/**
 * A Conta bancária: o elo entre uma Despesa ou Entrada e o dinheiro real —
 * pagar debita, receber credita (`CONTEXT.md`).
 *
 * Estruturalmente idêntica a `BankAccount` de `@shared/types/bank-account`; o
 * porquê do sufixo `Entity` está em `domain/expense.ts`.
 */
export type BankAccountEntity = {
  id: number;
  name: string;
  balance: number;
  createdAt: string;
};
