/**
 * A Entrada de um Mês: um recebimento previsto ou lançado, nascido de uma
 * Entrada padrão ou avulso (`CONTEXT.md`).
 *
 * `IncomeEntity` é estruturalmente idêntica a `Income` de
 * `@shared/types/income`; o porquê do sufixo `Entity` está em `domain/expense.ts`.
 */
export type IncomeEntity = {
  id: number;
  monthId: number;
  name: string;
  expectedDate: string | null;
  amount: number;
  isReceived: boolean;
  receivedAt: string | null;
  notes: string | null;
  bankAccountId: number | null;
  /** Vem do JOIN com bank_accounts; ausente nas consultas que não fazem o JOIN. */
  bankAccountName?: string | null;
  createdAt: string;
};
