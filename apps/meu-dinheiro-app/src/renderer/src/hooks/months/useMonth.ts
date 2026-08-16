import { useEffect, useState } from 'react';
import { decodeAppError } from '@shared/errors/appError';
import { MonthDetail } from '@shared/types/month';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';

export function useMonth(id: string | undefined) {
  const [month, setMonth] = useState<MonthDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [prevMonthId, setPrevMonthId] = useState<number | null>(null);
  const [nextMonthId, setNextMonthId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showSnackbar, showError } = useSnackbar();

  async function reload() {
    if (!id) return;
    try {
      const [data, allMonths] = await Promise.all([api.getMonth(Number(id)), api.getMonths()]);
      setMonth(data);
      setNotFound(false);
      setError(null);

      const sorted = [...allMonths].sort((a, b) => a.year - b.year || a.month - b.month);
      const index = sorted.findIndex((m) => m.id === data.id);
      setPrevMonthId(index > 0 ? sorted[index - 1].id : null);
      setNextMonthId(index >= 0 && index < sorted.length - 1 ? sorted[index + 1].id : null);
    } catch (err) {
      if (decodeAppError(err).code === 'not-found') {
        setNotFound(true);
      } else {
        setError(err);
        showError(err);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function retry() {
    setLoading(true);
    setNotFound(false);
    setError(null);
    reload();
  }

  async function pay(
    expenseId: number,
    file?: File,
    notes?: string,
    paidAt?: string,
    bankAccountId?: number,
  ) {
    try {
      await api.payExpense(expenseId, file, notes, paidAt, bankAccountId);
      showSnackbar('Despesa marcada como paga!');
      await reload();
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  }

  async function unpay(expenseId: number) {
    try {
      await api.unpayExpense(expenseId);
      showSnackbar('Pagamento desmarcado');
      await reload();
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  }

  async function addExpense(data: {
    name: string;
    amount: number;
    due_date?: string;
    category_id?: number | null;
  }) {
    if (!id) return false;
    try {
      await api.createExpense(Number(id), data);
      showSnackbar('Despesa adicionada');
      await reload();
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  }

  async function editExpense(
    expenseId: number,
    data: {
      name: string;
      amount: number;
      due_date?: string;
      notes?: string;
      category_id?: number | null;
    },
  ) {
    try {
      await api.updateExpense(expenseId, data);
      showSnackbar('Despesa atualizada');
      await reload();
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  }

  async function deleteExpense(expenseId: number) {
    try {
      await api.deleteExpense(expenseId);
      showSnackbar('Despesa removida');
      await reload();
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  }

  async function receive(
    incomeId: number,
    notes?: string,
    receivedAt?: string,
    bankAccountId?: number,
  ) {
    try {
      await api.receiveIncome(incomeId, notes, receivedAt, bankAccountId);
      showSnackbar('Entrada marcada como recebida!');
      await reload();
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  }

  async function unreceive(incomeId: number) {
    try {
      await api.unreceiveIncome(incomeId);
      showSnackbar('Recebimento desmarcado');
      await reload();
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  }

  async function addIncome(data: {
    name: string;
    amount: number;
    expected_date?: string;
    bank_account_id?: number | null;
  }) {
    if (!id) return false;
    try {
      await api.createIncome(Number(id), data);
      showSnackbar('Entrada adicionada');
      await reload();
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  }

  async function editIncome(
    incomeId: number,
    data: {
      name: string;
      amount: number;
      expected_date?: string;
      notes?: string;
      bank_account_id?: number | null;
    },
  ) {
    try {
      await api.updateIncome(incomeId, data);
      showSnackbar('Entrada atualizada');
      await reload();
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  }

  async function deleteIncome(incomeId: number) {
    try {
      await api.deleteIncome(incomeId);
      showSnackbar('Entrada removida');
      await reload();
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  }

  async function deleteMonth() {
    if (!id) return false;
    setDeleting(true);
    try {
      await api.deleteMonth(Number(id));
      return true;
    } catch (err) {
      showError(err);
      return false;
    } finally {
      setDeleting(false);
    }
  }

  return {
    month,
    loading,
    notFound,
    error,
    prevMonthId,
    nextMonthId,
    deleting,
    retry,
    pay,
    unpay,
    addExpense,
    editExpense,
    deleteExpense,
    receive,
    unreceive,
    addIncome,
    editIncome,
    deleteIncome,
    deleteMonth,
  };
}
