/**
 * A Despesa padrão: o modelo do que se repete todo mês, de onde cada Mês novo
 * tira uma cópia na criação (`CONTEXT.md`).
 *
 * `DefaultExpenseEntity` é estruturalmente idêntica a `DefaultExpense` de
 * `@shared/types/expense` — e ainda não colapsou as duas num tipo só
 * (ADR-0005). O sufixo `Entity` existe para o mapper do controller poder
 * receber as duas formas lado a lado: sem nomes diferentes o `tsc` não
 * pegaria a troca de uma pela outra. São peças diferentes — esta é o
 * vocabulário do processo main, aquela é o contrato que atravessa o IPC — e
 * nada garante que sigam iguais. É o mesmo motivo em todo `domain/*.ts` deste
 * app que ainda não colapsou.
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
