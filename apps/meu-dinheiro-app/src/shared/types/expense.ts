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

export interface DefaultExpense {
  id: number;
  name: string;
  dueDay: number | null;
  amount: number;
  categoryId: number | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  createdAt: string;
}
