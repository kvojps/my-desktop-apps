/**
 * A Despesa de um Mês: um gasto lançado, nascido de uma Despesa padrão ou
 * avulso (`CONTEXT.md`).
 *
 * `ExpenseEntity` é estruturalmente idêntica a `Expense` de
 * `@shared/types/expense`, e o sufixo `Entity` existe por causa disso: as duas
 * formas podem aparecer lado a lado no mapper do controller (ticket 06), e sem
 * nomes diferentes o `tsc` não pegaria a troca de uma pela outra. São peças
 * diferentes — esta é o vocabulário do processo main, aquela é o contrato que
 * atravessa o IPC — e nada garante que sigam iguais. É o mesmo motivo em todo
 * `domain/*.ts` deste app.
 */
export type ExpenseEntity = {
  id: number;
  monthId: number;
  name: string;
  dueDate: string | null;
  amount: number;
  isPaid: boolean;
  paidAt: string | null;
  receipt: string | null;
  notes: string | null;
  bankAccountId: number | null;
  /** Vem do JOIN com bank_accounts; ausente nas consultas que não fazem o JOIN. */
  bankAccountName?: string | null;
  categoryId: number | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  createdAt: string;
};
