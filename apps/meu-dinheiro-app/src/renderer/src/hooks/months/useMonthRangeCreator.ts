import { useState } from 'react';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';
import {
  type MonthRange,
  batchSummary,
  clampRange,
  countMonths,
  isRangeValid,
} from '@/hooks/months/monthBatch';

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
    setRangeState((prev) =>
      clampRange(prev, typeof updater === 'function' ? updater(prev) : updater),
    );
  }

  async function createRange() {
    setCreating(true);
    try {
      const result = await api.createMonthsBatch(
        range.fromYear,
        range.fromMonth,
        range.toYear,
        range.toMonth,
      );
      const { message, severity } = batchSummary(result.created.length, result.errors);
      showSnackbar(message, severity);
    } catch (err) {
      showError(err);
    } finally {
      setCreating(false);
    }
  }

  return {
    range,
    setRange,
    creating,
    createRange,
    monthsCount: countMonths(range),
    rangeValid: isRangeValid(range),
  };
}
