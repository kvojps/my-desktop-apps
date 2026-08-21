import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { BankAccount } from '@shared/types/bank-account';
import { api } from '@/api/client';
import { useDataChanged } from '@/hooks/useDataChanged';
import { useSnackbar } from './SnackbarContext';

export interface BankAccountsContextValue {
  bankAccounts: BankAccount[];
  loading: boolean;
  error: unknown;
  retry: () => void;
  save: (data: { name: string; balance?: number }, editingId?: number) => Promise<boolean>;
  remove: (id: number) => Promise<void>;
  reload: () => Promise<void>;
}

const BankAccountsContext = createContext<BankAccountsContextValue | null>(null);

export function BankAccountsProvider({ children }: { children: ReactNode }) {
  const { showError, showSnackbar } = useSnackbar();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const reload = useCallback(async () => {
    try {
      const d = await api.getBankAccounts();
      d.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      setBankAccounts(d);
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

  const save = useCallback(
    async (data: { name: string; balance?: number }, editingId?: number) => {
      try {
        if (editingId) {
          await api.updateBankAccount(editingId, data);
          showSnackbar('Conta atualizada');
        } else {
          await api.createBankAccount(data);
          showSnackbar('Conta adicionada');
        }
        return true;
      } catch (err) {
        showError(err);
        return false;
      }
    },
    [showError, showSnackbar],
  );

  const remove = useCallback(
    async (id: number) => {
      try {
        await api.deleteBankAccount(id);
        showSnackbar('Conta removida');
      } catch (err) {
        showError(err);
      }
    },
    [showError, showSnackbar],
  );

  const value = useMemo<BankAccountsContextValue>(
    () => ({ bankAccounts, loading, error, retry, save, remove, reload }),
    [bankAccounts, loading, error, retry, save, remove, reload],
  );

  return <BankAccountsContext.Provider value={value}>{children}</BankAccountsContext.Provider>;
}

export function useBankAccountsContext(): BankAccountsContextValue {
  const ctx = useContext(BankAccountsContext);
  if (!ctx) {
    throw new Error('useBankAccountsContext must be used within a BankAccountsProvider');
  }
  return ctx;
}
