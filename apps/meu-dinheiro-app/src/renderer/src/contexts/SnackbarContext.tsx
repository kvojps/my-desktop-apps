import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { describeAppError } from '@shared/errors/appError';
import { AppSnackbar } from '@/components/AppSnackbar';

export type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarState {
  key: number;
  message: string;
  severity: SnackbarSeverity;
}

interface SnackbarContextValue {
  showSnackbar: (message: string, severity?: SnackbarSeverity) => void;
  showError: (err: unknown, fallback?: string) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  // Uma mensagem por vez, as demais em fila: uma ação que dispara vários avisos
  // (salvar em lote, importar) trocava o texto no meio da leitura e só o último
  // sobrevivia.
  const [queue, setQueue] = useState<SnackbarState[]>([]);
  const [current, setCurrent] = useState<SnackbarState | null>(null);
  const [open, setOpen] = useState(false);
  const nextKey = useRef(0);

  useEffect(() => {
    if (current || queue.length === 0) return;
    setCurrent(queue[0]);
    setQueue((prev) => prev.slice(1));
    setOpen(true);
  }, [current, queue]);

  const enqueue = useCallback((message: string, severity: SnackbarSeverity) => {
    nextKey.current += 1;
    setQueue((prev) => [...prev, { key: nextKey.current, message, severity }]);
  }, []);

  const showSnackbar = useCallback(
    (message: string, severity: SnackbarSeverity = 'success') => enqueue(message, severity),
    [enqueue],
  );

  const showError = useCallback(
    (err: unknown, fallback = 'Ocorreu um erro') =>
      enqueue(describeAppError(err, fallback), 'error'),
    [enqueue],
  );

  const closeSnackbar = useCallback(() => setOpen(false), []);

  /** Só depois da saída da mensagem atual a próxima entra, sem sobreposição. */
  const handleExited = useCallback(() => setCurrent(null), []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar, showError }}>
      {children}
      <AppSnackbar snackbar={current} open={open} onClose={closeSnackbar} onExited={handleExited} />
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return ctx;
}
