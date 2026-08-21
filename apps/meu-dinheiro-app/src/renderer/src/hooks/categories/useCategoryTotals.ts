import { useCallback, useEffect, useRef, useState } from 'react';
import { CategoryTotal } from '@shared/types/category';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useDataChanged } from '@/hooks/useDataChanged';

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
    key: item.categoryId ? String(item.categoryId) : 'uncategorized',
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
  // O erro guardado é o próprio, e não um booleano: o `ErrorState` decodifica o
  // código para saber se oferece "restaurar backup" ou "abrir pasta de dados".
  const [error, setError] = useState<unknown>(null);
  // Descarta a resposta de uma busca que outra já começou: trocar de ano
  // depressa nas setas pintaria o ano velho por cima do novo. Substitui o
  // antigo flag `cancelled`, que só cobria a troca de ano — agora a recarga do
  // aviso do main concorre com ela.
  const requestId = useRef(0);

  const load = useCallback(
    async (silent = false) => {
      if (!Number.isInteger(year) || year <= 0) {
        setRows([]);
        setError(null);
        setLoading(false);
        return;
      }

      const id = ++requestId.current;
      // Recarga em segundo plano não vira skeleton (design system, §5.3).
      if (!silent) setLoading(true);
      try {
        const data = await api.getCategoryTotalsForYear(year);
        if (id !== requestId.current) return;
        setRows(data);
        setError(null);
      } catch (err) {
        if (id !== requestId.current) return;
        setError(err);
        showError(err);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [year, showError],
  );

  const retry = useCallback(() => load(), [load]);

  useEffect(() => {
    load();
  }, [load]);

  useDataChanged(() => load(true));

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

  return { tableRows, chartRows, topCategory, grandTotal, loading, error, retry };
}
