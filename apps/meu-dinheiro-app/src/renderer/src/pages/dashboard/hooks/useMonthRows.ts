import { useMemo } from 'react';
import type { Month } from '@shared/types/month';
import { computeMonthBalance } from '@/hooks/months/useMonthBalance';
import { type MonthRow, monthKey } from '../utils/monthRows';

/**
 * Os meses do intervalo achatados em linhas da tabela.
 *
 * Os totais saem de `computeMonthBalance`, e não de uma conta local: Realizado
 * é `recebido − pago` em toda tela do app, e reescrevê-lo aqui para preencher
 * uma coluna é o jeito de as duas versões divergirem.
 */
export function useMonthRows(months: Month[], currentKey: string): MonthRow[] {
  return useMemo(
    () =>
      months.map((month) => {
        const balance = computeMonthBalance(month);
        const key = monthKey(month.year, month.month);
        return {
          id: month.id,
          label: month.label,
          sortKey: key,
          isCurrent: key === currentKey,
          overdue: month.overdueExpenses ?? 0,
          overdueAmount: month.overdueAmount ?? 0,
          totalIncome: balance.totalIncome,
          totalExpense: balance.totalExpense,
          realized: balance.realized,
          paidCount: month.paidExpenses ?? 0,
          expenseCount: month.totalExpenses ?? 0,
        };
      }),
    [months, currentKey],
  );
}
