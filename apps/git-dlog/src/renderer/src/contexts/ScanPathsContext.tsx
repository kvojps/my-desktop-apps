import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ScanPath } from '@shared/types/scanPath';
import { api } from '@/api/client';
import { useDataChanged } from '@/hooks/useDataChanged';
import { useSnackbar } from './SnackbarContext';

export interface ScanPathsContextValue {
  scanPaths: ScanPath[];
  isLoading: boolean;
  error: unknown;
  retry: () => void;
  addScanPath: (path: string) => Promise<ScanPath>;
  deleteScanPath: (id: string) => Promise<void>;
  refreshScanPaths: () => Promise<void>;
}

const ScanPathsContext = createContext<ScanPathsContextValue | null>(null);

export function ScanPathsProvider({ children }: { children: ReactNode }) {
  const { showSnackbar } = useSnackbar();
  const [scanPaths, setScanPaths] = useState<ScanPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  async function refreshScanPaths() {
    const all = await api.getScanPaths();
    setScanPaths(all);
    setError(null);
  }

  function load() {
    refreshScanPaths()
      .catch((err) => {
        setError(err);
        showSnackbar('Erro ao carregar os diretórios.', 'error');
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O main avisa toda vez que algo é gravado; ninguém precisa lembrar de
  // recarregar depois de escrever. `load` não levanta `isLoading` fora do boot,
  // então a recarga acontece por baixo da lista já visível.
  useDataChanged(load);

  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addScanPath(path: string) {
    const scanPath = await api.addScanPath(path);
    setScanPaths((prev) => [...prev, scanPath]);
    return scanPath;
  }

  async function deleteScanPath(id: string) {
    await api.deleteScanPath(id);
    setScanPaths((prev) => prev.filter((s) => s.id !== id));
  }

  const value = useMemo<ScanPathsContextValue>(
    () => ({
      scanPaths,
      isLoading,
      error,
      retry,
      addScanPath,
      deleteScanPath,
      refreshScanPaths,
    }),
    [scanPaths, isLoading, error, retry],
  );

  return <ScanPathsContext.Provider value={value}>{children}</ScanPathsContext.Provider>;
}

export function useScanPathsContext(): ScanPathsContextValue {
  const ctx = useContext(ScanPathsContext);
  if (!ctx) {
    throw new Error('useScanPathsContext must be used within a ScanPathsProvider');
  }
  return ctx;
}
