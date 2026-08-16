import { useCallback, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';

export function useDataTransfer() {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const result = await window.api.data.export();
      if (result.success) {
        showToast('Dados exportados com sucesso!', 'success');
      }
    } catch {
      showToast('Erro ao exportar dados.', 'error');
    } finally {
      setExporting(false);
    }
  }, [showToast]);

  const requestImport = useCallback(() => setConfirmOpen(true), []);
  const cancelImport = useCallback(() => setConfirmOpen(false), []);

  const confirmImport = useCallback(async () => {
    setConfirmOpen(false);
    setImporting(true);
    try {
      const result = await window.api.data.import();
      if (result.success) {
        showToast('Dados importados com sucesso! Recarregando...', 'success');
        setTimeout(() => window.location.reload(), 1200);
        return;
      }
      if (result.error !== 'canceled') {
        showToast('Não foi possível importar o arquivo. Verifique se é um backup válido.', 'error');
      }
    } catch {
      showToast('Erro ao importar dados.', 'error');
    } finally {
      setImporting(false);
    }
  }, [showToast]);

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
