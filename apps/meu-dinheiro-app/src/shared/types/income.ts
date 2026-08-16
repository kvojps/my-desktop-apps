export interface Income {
  id: number;
  month_id: number;
  name: string;
  expected_date: string | null;
  amount: number;
  is_received: number;
  received_at: string | null;
  notes: string | null;
  bank_account_id: number | null;
  bank_account_name?: string | null;
  created_at: string;
}

export interface DefaultIncome {
  id: number;
  name: string;
  expected_day: number | null;
  amount: number;
  bank_account_id: number | null;
  bank_account_name?: string | null;
  created_at: string;
}
