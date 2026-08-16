import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { RepoFetchProgress, RepoScanResult } from '@shared/types/repoScan';
import { api } from '@/api/client';
import { pluralize } from '@/utils/format';
import { useScanPathsContext } from './ScanPathsContext';
import { useSnackbar } from './SnackbarContext';

export interface ReposContextValue {
  results: RepoScanResult[];
  isScanning: boolean;
  isFetching: boolean;
  /** Falha da última varredura; a busca no remoto reporta pelo snackbar. */
  error: unknown;
  fetchProgress: RepoFetchProgress | null;
  lastScanAt: string | null;
  /** Varredura local, sem rede. */
  scan: () => Promise<void>;
  /** `git fetch` nos remotos e, em seguida, nova varredura. */
  fetchRemote: () => Promise<void>;
}

const ReposContext = createContext<ReposContextValue | null>(null);

export function ReposProvider({ children }: { children: ReactNode }) {
  const { showSnackbar, showError } = useSnackbar();
  const { scanPaths, isLoading: isLoadingScanPaths } = useScanPathsContext();
  const [results, setResults] = useState<RepoScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchProgress, setFetchProgress] = useState<RepoFetchProgress | null>(null);
  const [lastScanAt, setLastScanAt] = useState<string | null>(null);

  useEffect(() => api.onReposFetchProgress(setFetchProgress), []);

  const scan = useCallback(async () => {
    setIsScanning(true);
    try {
      const scanResults = await api.scanRepos();
      setResults(scanResults);
      setLastScanAt(new Date().toISOString());
      setError(null);
    } catch (err) {
      setError(err);
      showError(err, 'Erro ao escanear os repositórios.');
    } finally {
      setIsScanning(false);
    }
  }, [showError]);

  /**
   * A varredura é local e instantânea, então não faz sentido abrir o app numa
   * tela vazia pedindo um clique. Roda uma única vez por sessão, assim que se
   * sabe que há diretórios cadastrados; "Buscar do remoto" continua manual,
   * porque é a operação que vai à rede.
   */
  const hasAutoScanned = useRef(false);
  useEffect(() => {
    if (hasAutoScanned.current || isLoadingScanPaths || scanPaths.length === 0) return;
    hasAutoScanned.current = true;
    void scan();
  }, [isLoadingScanPaths, scanPaths.length, scan]);

  const fetchRemote = useCallback(async () => {
    setIsFetching(true);
    setFetchProgress(null);
    try {
      const { results: scanResults, failures, prFailures } = await api.fetchRepos();
      setResults(scanResults);
      setLastScanAt(new Date().toISOString());

      const messages: string[] = [];
      if (failures.length > 0) {
        messages.push(
          `${pluralize(failures.length, 'repositório falhou', 'repositórios falharam')} no fetch: ${failures
            .map((failure) => failure.name)
            .join(', ')}`,
        );
      }
      if (prFailures.length > 0) {
        messages.push(
          `PRs não carregados em ${prFailures.map((failure) => failure.name).join(', ')}`,
        );
      }

      if (messages.length > 0) {
        showSnackbar(messages.join(' · '), 'warning');
      } else {
        showSnackbar('Repositórios e pull requests atualizados.');
      }
    } catch (err) {
      showError(err, 'Erro ao buscar dos remotos.');
    } finally {
      setIsFetching(false);
      setFetchProgress(null);
    }
  }, [showSnackbar, showError]);

  const value = useMemo<ReposContextValue>(
    () => ({
      results,
      isScanning,
      isFetching,
      error,
      fetchProgress,
      lastScanAt,
      scan,
      fetchRemote,
    }),
    [results, isScanning, isFetching, error, fetchProgress, lastScanAt, scan, fetchRemote],
  );

  return <ReposContext.Provider value={value}>{children}</ReposContext.Provider>;
}

export function useReposContext(): ReposContextValue {
  const ctx = useContext(ReposContext);
  if (!ctx) {
    throw new Error('useReposContext must be used within a ReposProvider');
  }
  return ctx;
}
