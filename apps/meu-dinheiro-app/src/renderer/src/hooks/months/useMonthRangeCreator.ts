import { useState } from 'react';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';

export const MAX_BATCH_MONTHS = 60;

interface MonthRange {
  fromYear: number;
  fromMonth: number;
  toYear: number;
  toMonth: number;
}

function monthIndex(year: number, month: number) {
  return year * 12 + month;
}

export function useMonthRangeCreator() {
  const { showSnackbar, showError } = useSnackbar();
  const currentYear = new Date().getFullYear();
  const [range, setRangeState] = useState<MonthRange>({
    fromYear: currentYear,
    fromMonth: 1,
    toYear: currentYear,
    toMonth: 12,
  });
  const [creating, setCreating] = useState(false);

  function setRange(updater: MonthRange | ((prev: MonthRange) => MonthRange)) {
    setRangeState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (monthIndex(next.toYear, next.toMonth) < monthIndex(next.fromYear, next.fromMonth)) {
        const fromChanged = next.fromYear !== prev.fromYear || next.fromMonth !== prev.fromMonth;
        if (fromChanged) {
          return { ...next, toYear: next.fromYear, toMonth: next.fromMonth };
        }
        return { ...next, fromYear: next.toYear, fromMonth: next.toMonth };
      }
      return next;
    });
  }

  const monthsCount =
    monthIndex(range.toYear, range.toMonth) - monthIndex(range.fromYear, range.fromMonth) + 1;
  const rangeValid = monthsCount >= 1 && monthsCount <= MAX_BATCH_MONTHS;

  async function createRange() {
    setCreating(true);
    try {
      const result = await api.createMonthsBatch(
        range.fromYear,
        range.fromMonth,
        range.toYear,
        range.toMonth,
      );
      const msgs = [`${result.created.length} mes(es) adicionado(s)!`];
      if (result.errors.length > 0) msgs.push(...result.errors);
      showSnackbar(msgs.join(' | '), result.errors.length > 0 ? 'warning' : 'success');
    } catch (err) {
      showError(err);
    } finally {
      setCreating(false);
    }
  }

  return { range, setRange, creating, createRange, monthsCount, rangeValid };
}
