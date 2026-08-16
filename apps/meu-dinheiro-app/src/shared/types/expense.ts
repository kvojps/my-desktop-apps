export interface Expense {
  id: number;
  month_id: number;
  name: string;
  due_date: string | null;
  amount: number;
  is_paid: number;
  paid_at: string | null;
  receipt: string | null;
  notes: string | null;
  bank_account_id: number | null;
  bank_account_name?: string | null;
  category_id: number | null;
  category_name?: string | null;
  category_color?: string | null;
  created_at: string;
}

export interface DefaultExpense {
  id: number;
  name: string;
  due_day: number | null;
  amount: number;
  category_id: number | null;
  category_name?: string | null;
  category_color?: string | null;
  created_at: string;
}
