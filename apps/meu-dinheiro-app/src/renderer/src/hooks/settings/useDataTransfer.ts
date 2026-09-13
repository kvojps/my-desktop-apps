import { useState } from 'react';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';

/**
 * Exportar e importar o backup completo.
 *
 * As duas operações abrem um seletor nativo, e **cancelar não é sucesso**: o
 * main devolve `canceled`, e o silêncio é a resposta certa — nada foi gravado
 * nem lido, e não há o que avisar. Enquanto uma delas corre, o botão fica
 * desligado: um segundo clique abriria um segundo seletor sobre o primeiro.
 *
 * A recusa do arquivo é aviso, não `showError`: ela vem do main como uma frase
 * pronta ("Não foi possível ler o arquivo de backup"), e `showError` a
 * embrulharia num `Error` sem código, que o `decodeAppError` lê como `unknown`
 * e exibe como "Ocorreu um erro" — trocando a única informação útil da falha
 * por um genérico. É o mesmo caminho que o `ErrorState` já usa ao restaurar.
 */
export function useDataTransfer() {
  const { showSnackbar, showError } = useSnackbar();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  async function exportData() {
    setExporting(true);
    try {
      const result = await api.exportData();
      if (result.success) {
        showSnackbar('Arquivo exportado com sucesso');
      } else if (result.error !== 'canceled') {
        showSnackbar('Não foi possível exportar os dados', 'error');
      }
    } catch (err) {
      showError(err);
    } finally {
      setExporting(false);
    }
  }

  async function importData() {
    setImporting(true);
    try {
      const result = await api.importData();
      if (result.success) {
        showSnackbar('Dados importados com sucesso!');
      } else if (result.error !== 'canceled') {
        showSnackbar(result.message ?? 'Arquivo de backup inválido', 'error');
      }
    } catch (err) {
      showError(err);
    } finally {
      setImporting(false);
    }
  }

  return { exporting, importing, exportData, importData };
}
