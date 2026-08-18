import { useMemo } from 'react';
import { Month, MonthDetail } from '@shared/types/month';
import { formatCurrency } from '@/utils/format';

/**
 * Os dois conceitos de saldo do app, sempre calculados juntos para que nenhuma
 * tela precise escolher (e divergir):
 * - `realized`: o que de fato entrou e saiu (recebido - pago).
 * - `projected`: o que deve acontecer se tudo for cumprido (entradas - despesas).
 */
export interface MonthBalance {
  received: number;
  pendingIncome: number;
  totalIncome: number;
  paid: number;
  pendingExpense: number;
  totalExpense: number;
  realized: number;
  projected: number;
}

export const BALANCE_LABELS = {
  realized: 'Realizado',
  projected: 'Previsto',
  realizedHint: 'recebido - pago',
  projectedHint: 'entradas - despesas',
} as const;

type BalanceTotals = Omit<MonthBalance, 'realized' | 'projected'>;

const EMPTY_TOTALS: BalanceTotals = {
  received: 0,
  pendingIncome: 0,
  totalIncome: 0,
  paid: 0,
  pendingExpense: 0,
  totalExpense: 0,
};

function withDerived(totals: BalanceTotals): MonthBalance {
  return {
    ...totals,
    realized: totals.received - totals.paid,
    projected: totals.totalIncome - totals.totalExpense,
  };
}

function isMonthDetail(month: Month | MonthDetail): month is MonthDetail {
  return Array.isArray((month as MonthDetail).expenses);
}

function fromItems(month: MonthDetail): BalanceTotals {
  const totals = { ...EMPTY_TOTALS };

  for (const income of month.incomes) {
    const amount = income.amount ?? 0;
    totals.totalIncome += amount;
    if (income.isReceived) totals.received += amount;
    else totals.pendingIncome += amount;
  }

  for (const expense of month.expenses) {
    const amount = expense.amount ?? 0;
    totals.totalExpense += amount;
    if (expense.isPaid) totals.paid += amount;
    else totals.pendingExpense += amount;
  }

  return totals;
}

function fromAggregates(month: Month): BalanceTotals {
  return {
    received: month.receivedIncome ?? 0,
    pendingIncome: month.pendingIncome ?? 0,
    totalIncome: month.totalIncome ?? 0,
    paid: month.paidAmount ?? 0,
    pendingExpense: month.unpaidAmount ?? 0,
    totalExpense: month.totalAmount ?? 0,
  };
}

export function computeMonthBalance(month: Month | MonthDetail | null | undefined): MonthBalance {
  if (!month) return withDerived(EMPTY_TOTALS);
  return withDerived(isMonthDetail(month) ? fromItems(month) : fromAggregates(month));
}

export function sumMonthBalances(months: Month[]): MonthBalance {
  const totals = months.reduce<BalanceTotals>((acc, month) => {
    const item = fromAggregates(month);
    return {
      received: acc.received + item.received,
      pendingIncome: acc.pendingIncome + item.pendingIncome,
      totalIncome: acc.totalIncome + item.totalIncome,
      paid: acc.paid + item.paid,
      pendingExpense: acc.pendingExpense + item.pendingExpense,
      totalExpense: acc.totalExpense + item.totalExpense,
    };
  }, EMPTY_TOTALS);

  return withDerived(totals);
}

export function useMonthBalance(month: Month | MonthDetail | null | undefined): MonthBalance {
  return useMemo(() => computeMonthBalance(month), [month]);
}

export function useMonthsBalance(months: Month[]): MonthBalance {
  return useMemo(() => sumMonthBalances(months), [months]);
}

/**
 * Legenda de um card de entrada ou despesa. O total já é o valor do card, então
 * a legenda carrega só o que ainda não aconteceu — o lado realizado é a
 * diferença, e o card de Realizado já o mostra somado.
 */
export function pendingSubtitle(
  total: number,
  pending: number,
  pendingLabel: string,
  doneLabel: string,
): string | undefined {
  if (total === 0) return undefined;
  if (pending <= 0) return doneLabel;
  return `${pendingLabel} ${formatCurrency(pending)}`;
}
