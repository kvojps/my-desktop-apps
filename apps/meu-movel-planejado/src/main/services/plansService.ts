import type { ExportResult } from '@shared/ipc/api';
import type { PlanInput } from '@shared/types/plan';
import type { PlanEntity } from '../domain/plan';
import { planExportFileName } from '../domain/planExportFileName';
import type { Repositories } from '../infra/database';
import type {
  DialogFileType,
  DialogParentWindow,
  DialogsGateway,
} from '../infra/gateways/system/dialogs';
import type { FileSystemGateway } from '../infra/gateways/system/fileSystem';
import type { PrintingGateway } from '../infra/gateways/system/printing';
import { AppError } from '../utils/errors/AppError';
import { errorReason } from '../utils/errors/errorReason';

/**
 * O plano de corte: o vigente do projeto, gravar o recém-gerado, imprimir e
 * exportar como PNG (para o celular do ajudante) ou PDF (para arquivar junto do
 * orçamento).
 *
 * Os gateways chegam por parâmetro pelo motivo de sempre nos de `system/`: falam
 * Electron. O `printing` sabe `webContents.print` e `printToPDF`; o service só
 * costura o diálogo, o disco e o banco. A janela nunca chega como `WebContents`
 * cru — o controller a resolve com `windowFor(event)` e a passa como handle
 * opaco.
 *
 * Nenhuma saída manda o plano por IPC para ser redesenhado aqui: o que vai para
 * o papel e para o PDF é o documento que o renderer já tem montado, revelado
 * pelo `@media print` (design system, §5.6).
 */

const PROJECT_GONE = 'Este projeto não existe mais.';
const PLAN_MISSING = 'Este projeto ainda não tem um plano gerado.';

type ExportFormat = 'png' | 'pdf';

/** O que o diálogo de salvar oferece em cada formato. */
const FILE_TYPES: Record<ExportFormat, DialogFileType> = {
  png: { name: 'Imagem PNG', extensions: ['png'] },
  pdf: { name: 'Documento PDF', extensions: ['pdf'] },
};

export function makePlansService(
  repos: Repositories,
  fileSystem: FileSystemGateway,
  dialogs: DialogsGateway,
  printing: PrintingGateway,
) {
  /**
   * Onde salvar, perguntado sobre a janela que pediu — com o nome sugerido lido
   * do banco, e não recebido do renderer: quem exporta escolhe o formato e a
   * pasta, não a identidade do arquivo.
   *
   * `null` é o usuário tendo fechado o diálogo. Cancelar sobe como resultado até
   * a tela, e não como exceção: foi o usuário que respondeu.
   */
  async function askWhereToSave(
    window: DialogParentWindow,
    projectId: string,
    format: ExportFormat,
  ): Promise<string | null> {
    const project = repos.projects.findById(projectId);
    if (!project) throw new AppError(404, PROJECT_GONE);

    const plan = repos.plans.findByProject(projectId);
    // Exportar sem plano não acontece pela tela — o botão vive na prancheta —, e
    // por IPC seria um arquivo do nada.
    if (!plan) throw new AppError(404, PLAN_MISSING);

    return dialogs.showSaveDialog(window, {
      title: 'Exportar plano de corte',
      defaultPath: planExportFileName(project.name, plan.generatedAt, format),
      fileTypes: [FILE_TYPES[format]],
    });
  }

  /**
   * A gravação, com a falha classificada como falha **de exportação**. Sem o
   * código próprio, um `EACCES` daqui seria classificado como problema da pasta
   * de dados do app, e a tela mandaria o usuário conferir permissões de uma
   * pasta que não é a que ele acabou de escolher.
   */
  async function writeExported(filePath: string, data: Uint8Array): Promise<ExportResult> {
    try {
      await fileSystem.writeBytes(filePath, data);
    } catch (err) {
      throw new AppError(500, `Falha ao gravar o arquivo: ${errorReason(err)}`, 'export-failed');
    }
    return { success: true, filePath };
  }

  return {
    /**
     * O plano vigente do projeto. `null` quando ninguém mandou gerar — é o
     * estado normal de um projeto novo, não 404.
     */
    get(projectId: string): PlanEntity | null {
      return repos.plans.findByProject(projectId);
    },

    /**
     * Grava o plano recém-gerado, substituindo o vigente numa transação só: o
     * `DELETE` leva as chapas planejadas, as colocações e os dois lotes de fora
     * por cascata, e uma falha no meio devolve o plano anterior intacto.
     *
     * **Verbo provisório**: o ticket 07 o substitui por `generate(projectId)`,
     * quando o empacotador entra no main. Escrever `save` agora e trocá-lo
     * depois é o preço de manter cada ticket com a árvore verde (spec, decisão 9).
     */
    save(projectId: string, input: PlanInput): PlanEntity {
      if (!repos.projects.exists(projectId)) throw new AppError(404, PROJECT_GONE);
      return repos.transaction(() => repos.plans.replaceForProject(projectId, input));
    },

    /** `false` quando o usuário cancela o diálogo do sistema: cancelar é resposta, não falha. */
    print(window: DialogParentWindow): Promise<boolean> {
      return printing.print(window);
    },

    async exportPng(
      window: DialogParentWindow,
      projectId: string,
      bytes: Uint8Array,
    ): Promise<ExportResult> {
      const filePath = await askWhereToSave(window, projectId, 'png');
      if (!filePath) return { success: false, error: 'canceled' };
      return writeExported(filePath, bytes);
    },

    async exportPdf(window: DialogParentWindow, projectId: string): Promise<ExportResult> {
      const filePath = await askWhereToSave(window, projectId, 'pdf');
      if (!filePath) return { success: false, error: 'canceled' };

      const pdf = await printing.printToPdf(window);
      return writeExported(filePath, pdf);
    },
  };
}

export type PlansService = ReturnType<typeof makePlansService>;
