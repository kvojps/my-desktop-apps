/**
 * A Despesa padrão: o modelo do que se repete todo mês, de onde cada Mês novo
 * tira uma cópia na criação (`CONTEXT.md`).
 *
 * Estruturalmente idêntica a `DefaultExpense` de `@shared/types/expense`; o
 * porquê do sufixo `Entity` está em `domain/expense.ts`.
 */
export type DefaultExpenseEntity = {
  id: number;
  name: string;
  dueDay: number | null;
  amount: number;
  categoryId: number | null;
  /** Vem do JOIN com categories; ausente nas consultas que não fazem o JOIN. */
  categoryName?: string | null;
  categoryColor?: string | null;
  createdAt: string;
};
