import { useCallback, useState } from 'react';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';

/**
 * O backup: gravar tudo num arquivo e restaurar tudo a partir de um.
 *
 * As duas metades não são simétricas, e é isso que o hook carrega. Exportar não
 * tem consequência — o pior que acontece é um arquivo a mais no disco —, e por
 * isso vai direto. Importar apaga todos os projetos, peças, chapas e planos do
 * computador, e por isso passa por confirmação antes.
 *
 * Como em toda saída em arquivo do app, cancelar o diálogo não vira aviso: o
 * usuário fechou um diálogo que ele mesmo abriu, e narrá-lo de volta seria
 * ruído. Recusa de arquivo — ilegível, de outro app, de formato desconhecido —
 * sobe do main já com a mensagem certa, e a tela só a exibe.
 */
export function useDataTransfer() {
  const { showSnackbar, showError } = useSnackbar();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const exportData = useCallback(async () => {
    setExporting(true);
    try {
      const result = await api.exportData();
      if (result.success) showSnackbar('Backup salvo.');
    } catch (err) {
      showError(err, 'Não foi possível salvar o backup');
    } finally {
      setExporting(false);
    }
  }, [showError, showSnackbar]);

  const requestImport = useCallback(() => setConfirmOpen(true), []);
  const cancelImport = useCallback(() => setConfirmOpen(false), []);

  const confirmImport = useCallback(async () => {
    setImporting(true);
    try {
      const result = await api.importData();
      if (result.success) showSnackbar('Backup restaurado.');
    } catch (err) {
      // A mensagem própria da recusa vem daqui: arquivo que não é um backup
      // deste app, backup de um formato desconhecido e falha de leitura chegam
      // classificados e cada um diz o que fazer a seguir. O texto de reserva só
      // vale para o erro que não atravessou o IPC.
      showError(err, 'Não foi possível importar o backup');
    } finally {
      // A confirmação só fecha quando a operação termina: é o diálogo que
      // segura o rótulo "Importando...", e fechá-lo antes esconderia a única
      // indicação de que algo está acontecendo.
      setConfirmOpen(false);
      setImporting(false);
    }
    // Nenhuma recarga forçada da janela: importar é escrita, e o main avisa toda
    // tela viva de que os dados mudaram assim que o handler termina.
  }, [showError, showSnackbar]);

  return {
    exporting,
    importing,
    confirmOpen,
    exportData,
    requestImport,
    cancelImport,
    confirmImport,
  };
}
