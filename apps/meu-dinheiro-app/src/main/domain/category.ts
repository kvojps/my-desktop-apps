/**
 * A Categoria: classifica Despesas para o relatório de Histórico (`CONTEXT.md`).
 *
 * `CategoryEntity` é estruturalmente idêntica a `Category` de
 * `@shared/types/category`; o porquê do sufixo `Entity` está em
 * `domain/expense.ts`.
 */
export type CategoryEntity = {
  id: number;
  name: string;
  color: string;
  createdAt: string;
};

/**
 * Uma linha do relatório de Histórico: quanto foi gasto numa Categoria ao longo
 * de um ano. `categoryId` nulo é a linha "sem categoria" — a Despesa cuja
 * Categoria foi excluída (`CONTEXT.md`), agregada à parte.
 */
export type CategoryTotalEntity = {
  categoryId: number | null;
  name: string | null;
  color: string | null;
  total: number;
  count: number;
};
