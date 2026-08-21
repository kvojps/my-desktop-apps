import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Month } from '@shared/types/month';
import { api } from '@/api/client';
import { useDataChanged } from '@/hooks/useDataChanged';
import { useSnackbar } from './SnackbarContext';

export interface MonthsContextValue {
  months: Month[];
  loading: boolean;
  error: unknown;
  retry: () => void;
  /**
   * Recarrega a lista sem levantar `loading`. Chamada pelo aviso do main a cada
   * gravação — não precisa ser chamada à mão. A lista vive acima das rotas e
   * não se refaz ao trocar de tela; é o aviso que a mantém viva.
   */
  reload: () => Promise<void>;
}

const MonthsContext = createContext<MonthsContextValue | null>(null);

export function MonthsProvider({ children }: { children: ReactNode }) {
  const { showError } = useSnackbar();
  const [months, setMonths] = useState<Month[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const reload = useCallback(async () => {
    try {
      const data = await api.getMonths();
      setMonths(data);
      setError(null);
    } catch (err) {
      setError(err);
      showError(err);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O main avisa toda vez que algo é gravado; ninguém precisa lembrar de
  // recarregar depois de escrever.
  useDataChanged(reload);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    reload();
  }, [reload]);

  const value = useMemo<MonthsContextValue>(
    () => ({ months, loading, error, retry, reload }),
    [months, loading, error, retry, reload],
  );

  return <MonthsContext.Provider value={value}>{children}</MonthsContext.Provider>;
}

export function useMonthsContext(): MonthsContextValue {
  const ctx = useContext(MonthsContext);
  if (!ctx) {
    throw new Error('useMonthsContext must be used within a MonthsProvider');
  }
  return ctx;
}
