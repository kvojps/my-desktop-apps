import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CategoryTotal } from '@shared/types/category';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useDataChanged } from '@/hooks/useDataChanged';
import { categoryBreakdown } from './categoryRows';

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

  // O agrupamento é puro e mora em `categoryRows`: o que o hook faz é a leitura
  // do banco e os três estados dela. Manter as duas coisas juntas era o que
  // deixava a regra de "sete mais Outras" sem teste.
  const breakdown = useMemo(() => categoryBreakdown(rows), [rows]);

  return { ...breakdown, loading, error, retry };
}
