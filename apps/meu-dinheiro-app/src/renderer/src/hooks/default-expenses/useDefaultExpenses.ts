import { useEffect, useState } from 'react';
import { DefaultExpense } from '@shared/types/expense';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';

export function useDefaultExpenses() {
  const { showError, showSnackbar } = useSnackbar();
  const [defaultExpenses, setDefaultExpenses] = useState<DefaultExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  async function reload() {
    try {
      const d = await api.getDefaultExpenses();
      d.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      setDefaultExpenses(d);
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

  async function save(
    data: { name: string; due_day?: number; amount: number; category_id?: number | null },
    editingId?: number,
  ) {
    try {
      if (editingId) {
        await api.updateDefaultExpense(editingId, data);
        showSnackbar('Despesa padrão atualizada');
      } else {
        await api.createDefaultExpense(data);
        showSnackbar('Despesa padrão adicionada');
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
      await api.deleteDefaultExpense(id);
      showSnackbar('Despesa padrão removida');
      await reload();
    } catch (err) {
      showError(err);
    }
  }

  return { defaultExpenses, loading, error, retry, save, remove, reload };
}
