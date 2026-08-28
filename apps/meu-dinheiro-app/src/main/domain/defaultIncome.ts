/**
 * A Entrada padrão: o modelo do que se repete todo mês, de onde cada Mês novo
 * tira uma cópia na criação (`CONTEXT.md`).
 *
 * Estruturalmente idêntica a `DefaultIncome` de `@shared/types/income`; o
 * porquê do sufixo `Entity` está em `domain/expense.ts`.
 */
export type DefaultIncomeEntity = {
  id: number;
  name: string;
  expectedDay: number | null;
  amount: number;
  bankAccountId: number | null;
  /** Vem do JOIN com bank_accounts; ausente nas consultas que não fazem o JOIN. */
  bankAccountName?: string | null;
  createdAt: string;
};
