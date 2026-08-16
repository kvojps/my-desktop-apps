import { ReactNode, createContext, useCallback, useContext, useState } from 'react';
import { AppSnackbar } from '@/components/AppSnackbar';

export type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarState {
  message: string;
  severity: SnackbarSeverity;
}

interface SnackbarContextValue {
  showSnackbar: (message: string, severity?: SnackbarSeverity) => void;
  showError: (err: unknown, fallback?: string) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  const showSnackbar = useCallback((message: string, severity: SnackbarSeverity = 'success') => {
    setSnackbar({ message, severity });
  }, []);

  const showError = useCallback((err: unknown, fallback = 'Ocorreu um erro') => {
    setSnackbar({ message: err instanceof Error ? err.message : fallback, severity: 'error' });
  }, []);

  const closeSnackbar = useCallback(() => setSnackbar(null), []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar, showError }}>
      {children}
      <AppSnackbar snackbar={snackbar} onClose={closeSnackbar} />
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
