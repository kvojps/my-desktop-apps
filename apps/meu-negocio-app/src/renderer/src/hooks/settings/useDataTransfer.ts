import { useCallback, useState } from 'react';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';

export function useDataTransfer() {
  const { showSnackbar } = useSnackbar();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const result = await api.exportData();
      if (result.success) {
        showSnackbar('Dados exportados com sucesso!', 'success');
      }
    } catch {
      showSnackbar('Erro ao exportar dados.', 'error');
    } finally {
      setExporting(false);
    }
  }, [showSnackbar]);

  const requestImport = useCallback(() => setConfirmOpen(true), []);
  const cancelImport = useCallback(() => setConfirmOpen(false), []);

  const confirmImport = useCallback(async () => {
    setConfirmOpen(false);
    setImporting(true);
    try {
      const result = await api.importData();
      if (result.success) {
        showSnackbar('Dados importados com sucesso! Recarregando...', 'success');
        setTimeout(() => window.location.reload(), 1200);
        return;
      }
      if (result.error !== 'canceled') {
        showSnackbar(
          'Não foi possível importar o arquivo. Verifique se é um backup válido.',
          'error',
        );
      }
    } catch {
      showSnackbar('Erro ao importar dados.', 'error');
    } finally {
      setImporting(false);
    }
  }, [showSnackbar]);

  return {
    exporting,
    importing,
    confirmOpen,
    handleExport,
    requestImport,
    cancelImport,
    confirmImport,
  };
}
