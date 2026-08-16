import type { Expense } from './expense';
import type { Income } from './income';

export interface Month {
  id: number;
  label: string;
  year: number;
  month: number;
  created_at: string;
  total_expenses?: number;
  paid_expenses?: number;
  paid_amount?: number;
  unpaid_amount?: number;
  total_amount?: number;
  overdue_expenses?: number;
  overdue_amount?: number;
  total_incomes?: number;
  received_incomes?: number;
  received_income?: number;
  pending_income?: number;
  total_income?: number;
}

export interface MonthDetail extends Month {
  expenses: Expense[];
  incomes: Income[];
}
