import type { Expense } from './expense';
import type { Income } from './income';

export interface Month {
  id: number;
  label: string;
  year: number;
  month: number;
  createdAt: string;
  /**
   * Totais agregados pelo próprio SQL na listagem. Ausentes quando o mês é lido
   * isoladamente, por isso opcionais.
   */
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
}

export interface MonthDetail extends Month {
  expenses: Expense[];
  incomes: Income[];
}
