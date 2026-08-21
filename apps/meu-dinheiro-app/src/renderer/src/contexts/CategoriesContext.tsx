import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Category } from '@shared/types/category';
import { api } from '@/api/client';
import { useDataChanged } from '@/hooks/useDataChanged';
import { useSnackbar } from './SnackbarContext';

export interface CategoriesContextValue {
  categories: Category[];
  loading: boolean;
  error: unknown;
  retry: () => void;
  save: (data: { name: string; color: string }, editingId?: number) => Promise<boolean>;
  remove: (id: number) => Promise<void>;
  reload: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { showError, showSnackbar } = useSnackbar();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const reload = useCallback(async () => {
    try {
      const d = await api.getCategories();
      d.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      setCategories(d);
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
    async (data: { name: string; color: string }, editingId?: number) => {
      try {
        if (editingId) {
          await api.updateCategory(editingId, data);
          showSnackbar('Categoria atualizada');
        } else {
          await api.createCategory(data);
          showSnackbar('Categoria adicionada');
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
        await api.deleteCategory(id);
        showSnackbar('Categoria removida');
      } catch (err) {
        showError(err);
      }
    },
    [showError, showSnackbar],
  );

  const value = useMemo<CategoriesContextValue>(
    () => ({ categories, loading, error, retry, save, remove, reload }),
    [categories, loading, error, retry, save, remove, reload],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategoriesContext(): CategoriesContextValue {
  const ctx = useContext(CategoriesContext);
  if (!ctx) {
    throw new Error('useCategoriesContext must be used within a CategoriesProvider');
  }
  return ctx;
}
