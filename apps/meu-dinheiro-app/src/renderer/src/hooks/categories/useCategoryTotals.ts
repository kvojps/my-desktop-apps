import { useEffect, useState } from 'react';
import { CategoryTotal } from '@shared/types/category';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';

export const NEUTRAL_CATEGORY_COLOR = '#9AA0A6';
const MAX_CHART_CATEGORIES = 7;

export interface CategoryTotalRow {
  key: string;
  name: string;
  color: string;
  total: number;
  count: number;
  percent: number;
}

function toRow(item: CategoryTotal, total: number): CategoryTotalRow {
  return {
    key: item.category_id ? String(item.category_id) : 'uncategorized',
    name: item.name ?? 'Sem categoria',
    color: item.color ?? NEUTRAL_CATEGORY_COLOR,
    total: item.total,
    count: item.count,
    percent: total > 0 ? (item.total / total) * 100 : 0,
  };
}

export function useCategoryTotals(year: number) {
  const { showError } = useSnackbar();
  const [rows, setRows] = useState<CategoryTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(year) || year <= 0) {
      setRows([]);
      setError(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    api
      .getCategoryTotalsForYear(year)
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setError(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(true);
        showError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);
  const tableRows = rows.map((r) => toRow(r, grandTotal)).sort((a, b) => b.total - a.total);

  const chartRows = tableRows.slice(0, MAX_CHART_CATEGORIES);
  const rest = tableRows.slice(MAX_CHART_CATEGORIES);
  if (rest.length > 0) {
    const restTotal = rest.reduce((sum, r) => sum + r.total, 0);
    const restCount = rest.reduce((sum, r) => sum + r.count, 0);
    chartRows.push({
      key: 'other',
      name: 'Outras categorias',
      color: NEUTRAL_CATEGORY_COLOR,
      total: restTotal,
      count: restCount,
      percent: grandTotal > 0 ? (restTotal / grandTotal) * 100 : 0,
    });
  }

  const topCategory = tableRows[0] ?? null;

  return { tableRows, chartRows, topCategory, grandTotal, loading, error };
}
