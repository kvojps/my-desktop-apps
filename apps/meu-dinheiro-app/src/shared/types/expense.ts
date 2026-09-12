/**
 * A Despesa de um Mês: um gasto lançado, nascido de uma Despesa padrão ou
 * avulso (`CONTEXT.md`).
 *
 * Sem `ExpenseEntity` em `domain/`: nenhum campo aqui precisa ficar de fora do
 * IPC, então o repositório devolve este tipo direto, sem par no domínio nem
 * mapper de resposta (ADR-0005).
 */
export interface Expense {
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
}

/**
 * A Despesa padrão: o modelo do que se repete todo mês, de onde cada Mês novo
 * tira uma cópia na criação (`CONTEXT.md`).
 *
 * Sem `DefaultExpenseEntity` em `domain/`: nenhum campo aqui precisa ficar de
 * fora do IPC, então o repositório devolve este tipo direto, sem par no
 * domínio nem mapper de resposta (ADR-0005).
 */
export interface DefaultExpense {
  id: number;
  name: string;
  dueDay: number | null;
  amount: number;
  categoryId: number | null;
  /** Vem do JOIN com categories; ausente nas consultas que não fazem o JOIN. */
  categoryName?: string | null;
  categoryColor?: string | null;
  createdAt: string;
}
