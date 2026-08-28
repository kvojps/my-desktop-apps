import type { ExpenseEntity } from './expense';
import type { IncomeEntity } from './income';

/**
 * O Mês: o contêiner ano-mês em torno do qual o app se organiza (`CONTEXT.md`).
 *
 * `MonthEntity` é estruturalmente idêntica a `Month` de `@shared/types/month`;
 * o porquê do sufixo `Entity` está em `domain/expense.ts`.
 *
 * Os 12 campos de totais são agregados pelo próprio SQL na listagem e ficam
 * ausentes quando o Mês é lido isoladamente — por isso opcionais. `Realizado`
 * (`receivedIncome − paidAmount`) e `Previsto` (`totalIncome − totalAmount`)
 * são derivados destes na apresentação, não guardados aqui.
 */
export type MonthEntity = {
  id: number;
  label: string;
  year: number;
  month: number;
  createdAt: string;
  totalExpenses?: number;
  paidExpenses?: number;
  paidAmount?: number;
  unpaidAmount?: number;
  totalAmount?: number;
  overdueExpenses?: number;
  overdueAmount?: number;
  totalIncomes?: number;
  receivedIncomes?: number;
  receivedIncome?: number;
  pendingIncome?: number;
  totalIncome?: number;
};

/**
 * O Mês com as suas despesas e entradas resolvidas. Nó aninhado: cada folha tem
 * o seu próprio mapper (`rowToMonth` / `rowToExpense` / `rowToIncome`) e
 * `buildMonthDetail` compõe — sem atravessar o objeto inteiro por identidade
 * estrutural (README §2.5).
 */
export type MonthDetailEntity = MonthEntity & {
  expenses: ExpenseEntity[];
  incomes: IncomeEntity[];
};
