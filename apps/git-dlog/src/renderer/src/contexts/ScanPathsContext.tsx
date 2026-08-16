import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ScanPath } from '@shared/types/scanPath';
import { call } from '@/api/client';
import { useSnackbar } from './SnackbarContext';

export interface ScanPathsContextValue {
  scanPaths: ScanPath[];
  isLoading: boolean;
  addScanPath: (path: string) => Promise<ScanPath>;
  deleteScanPath: (id: string) => Promise<void>;
  refreshScanPaths: () => Promise<void>;
}

const ScanPathsContext = createContext<ScanPathsContextValue | null>(null);

export function ScanPathsProvider({ children }: { children: ReactNode }) {
  const { showSnackbar } = useSnackbar();
  const [scanPaths, setScanPaths] = useState<ScanPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshScanPaths() {
    const all = await call(() => window.api.scanPaths.getAll());
    setScanPaths(all);
  }

  useEffect(() => {
    refreshScanPaths()
      .catch(() => showSnackbar('Erro ao carregar os diretórios.', 'error'))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addScanPath(path: string) {
    const scanPath = await call(() => window.api.scanPaths.add(path));
    setScanPaths((prev) => [...prev, scanPath]);
    return scanPath;
  }

  async function deleteScanPath(id: string) {
    await call(() => window.api.scanPaths.delete(id));
    setScanPaths((prev) => prev.filter((s) => s.id !== id));
  }

  const value = useMemo<ScanPathsContextValue>(
    () => ({
      scanPaths,
      isLoading,
      addScanPath,
      deleteScanPath,
      refreshScanPaths,
    }),
    [scanPaths, isLoading],
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
