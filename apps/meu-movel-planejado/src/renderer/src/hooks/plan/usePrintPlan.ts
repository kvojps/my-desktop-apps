import { useCallback, useState } from 'react';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';

/**
 * Manda o plano para a impressora.
 *
 * Não há o que montar antes: o documento de impressão já está no DOM, ao lado
 * da tela, e quem o revela é o `@media print`. O que este hook faz é pedir ao
 * main que abra o diálogo do sistema sobre a janela — o main é quem tem a API
 * de impressão, e o renderer não tem como abrir esse diálogo sozinho.
 *
 * Cancelar não vira aviso nenhum: o usuário fechou um diálogo que ele mesmo
 * abriu, e dizer "impressão cancelada" seria o app narrando de volta o que
 * acabou de ser feito. Erro de verdade — sem impressora, driver recusando —
 * vira snackbar, porque aí houve uma intenção que não se cumpriu.
 */
export function usePrintPlan() {
  const { showError } = useSnackbar();
  const [isPrinting, setIsPrinting] = useState(false);

  const print = useCallback(async () => {
    setIsPrinting(true);
    try {
      await api.printPlan();
    } catch (err) {
      showError(err, 'Não foi possível imprimir o plano');
    } finally {
      setIsPrinting(false);
    }
  }, [showError]);

  return { print, isPrinting };
}
