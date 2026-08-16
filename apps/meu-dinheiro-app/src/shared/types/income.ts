export interface Income {
  id: number;
  monthId: number;
  name: string;
  expectedDate: string | null;
  amount: number;
  isReceived: boolean;
  receivedAt: string | null;
  notes: string | null;
  bankAccountId: number | null;
  /** Vem do JOIN com bank_accounts; ausente nas consultas que não fazem o JOIN. */
  bankAccountName?: string | null;
  createdAt: string;
}

export interface DefaultIncome {
  id: number;
  name: string;
  expectedDay: number | null;
  amount: number;
  bankAccountId: number | null;
  bankAccountName?: string | null;
  createdAt: string;
}
