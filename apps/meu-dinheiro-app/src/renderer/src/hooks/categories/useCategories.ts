import { useEffect, useState } from 'react';
import { Category } from '@shared/types/category';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';

export function useCategories() {
  const { showError, showSnackbar } = useSnackbar();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  async function reload() {
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
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retry() {
    setLoading(true);
    setError(null);
    reload();
  }

  async function save(data: { name: string; color: string }, editingId?: number) {
    try {
      if (editingId) {
        await api.updateCategory(editingId, data);
        showSnackbar('Categoria atualizada');
      } else {
        await api.createCategory(data);
        showSnackbar('Categoria adicionada');
      }
      await reload();
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  }

  async function remove(id: number) {
    try {
      await api.deleteCategory(id);
      showSnackbar('Categoria removida');
      await reload();
    } catch (err) {
      showError(err);
    }
  }

  return { categories, loading, error, retry, save, remove, reload };
}
