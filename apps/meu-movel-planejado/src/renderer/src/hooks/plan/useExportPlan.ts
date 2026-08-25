import { type RefObject, useCallback, useState } from 'react';
import type { ExportResult } from '@shared/ipc/api';
import { api } from '@/api/client';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { svgToPngBytes } from '@/utils/svgToPng';

/** Qual saída está em andamento, para o botão dizer o que está fazendo. */
export type ExportFormat = 'png' | 'pdf';

/** O aviso de cada formato, porque o arquivo salvo não aparece em lugar nenhum da tela. */
const SAVED_MESSAGE: Record<ExportFormat, string> = {
  png: 'Imagem do plano salva.',
  pdf: 'PDF do plano salvo.',
};

const FAILURE_MESSAGE: Record<ExportFormat, string> = {
  png: 'Não foi possível salvar a imagem do plano',
  pdf: 'Não foi possível salvar o PDF do plano',
};

/**
 * Salva o plano em arquivo, nos dois formatos.
 *
 * A divisão do trabalho é a mesma da impressão, com um passo a mais no PNG: o
 * desenho é do renderer e a gravação é do main. O PDF nem isso — ele é a janela
 * impressa para arquivo pelo próprio main, com o layout do papel.
 *
 * Cancelar o diálogo não vira aviso nenhum: o usuário fechou um diálogo que ele
 * mesmo abriu, e "exportação cancelada" seria o app narrando de volta o que
 * acabou de ser feito. Falha de verdade — pasta sem permissão, disco cheio —
 * vira snackbar, porque aí houve uma intenção que não se cumpriu.
 */
export function useExportPlan(projectId: string, imageRef: RefObject<SVGSVGElement | null>) {
  const { showSnackbar, showError } = useSnackbar();
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  const save = useCallback(
    async (format: ExportFormat, exportFile: () => Promise<ExportResult>) => {
      setExportingFormat(format);
      try {
        const result = await exportFile();
        if (result.success) showSnackbar(SAVED_MESSAGE[format]);
      } catch (err) {
        showError(err, FAILURE_MESSAGE[format]);
      } finally {
        setExportingFormat(null);
      }
    },
    [showError, showSnackbar],
  );

  const exportPng = useCallback(
    () =>
      save('png', async () => {
        const svg = imageRef.current;
        // O documento de imagem é montado junto com a tela; sem ele não há o
        // que exportar, e um arquivo vazio seria pior do que a recusa.
        if (!svg) throw new Error('A imagem do plano ainda não está pronta.');

        return api.exportPlanPng(projectId, await svgToPngBytes(svg));
      }),
    [imageRef, projectId, save],
  );

  const exportPdf = useCallback(
    () => save('pdf', () => api.exportPlanPdf(projectId)),
    [projectId, save],
  );

  return { exportPng, exportPdf, exportingFormat };
}
