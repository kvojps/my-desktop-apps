import type { ExportResult } from '@shared/ipc/api';
import { type CuttingPlanInputEntity, packCuttingPlan } from '../domain/nesting';
import type { PlanEntity } from '../domain/plan';
import { planExportFileName } from '../domain/planExportFileName';
import { toPlanInput } from '../domain/planSnapshot';
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
 * O plano de corte: o vigente do projeto, gerar um novo, imprimir e exportar
 * como PNG (para o celular do ajudante) ou PDF (para arquivar junto do
 * orçamento).
 *
 * Gerar empacota as peças nas chapas com `packCuttingPlan` de `domain/nesting` e
 * tira o snapshot com `domain/planSnapshot` antes de gravar — a regra pura mora
 * no main como qualquer outra (ADR-0003).
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
     * Gera o plano do projeto: carrega peças e chapas, empacota, tira o snapshot
     * e grava, substituindo o vigente numa transação só — o `DELETE` leva as
     * chapas planejadas, as colocações e os dois lotes de fora por cascata, e
     * uma falha no meio devolve o plano anterior intacto (melhor o papel de
     * ontem do que nenhum).
     *
     * O empacotamento roda aqui, no event loop do main: mediu abaixo de 500 ms
     * até um projeto dez vezes maior que uma cozinha inteira (ticket 01),
     * rápido o bastante para não pedir worker thread.
     *
     * `project.updatedAt` é lido **antes** de empacotar — é comparando com ele
     * que a tela sabe que um plano ficou para trás, e relê-lo depois marcaria
     * como atual um plano gerado sobre uma versão anterior do projeto.
     */
    generate(projectId: string): PlanEntity {
      const project = repos.projects.findById(projectId);
      if (!project) throw new AppError(404, PROJECT_GONE);

      // Só a geometria do corte entra: o empacotamento não depende do resto do
      // projeto, e `PieceEntity`/`SheetEntity` já satisfazem o que ele lê.
      const input: CuttingPlanInputEntity = {
        pieces: repos.pieces.listForProject(projectId),
        sheets: repos.sheets.listForProject(projectId),
        kerfTenthsMm: project.kerfTenthsMm,
        trimTenthsMm: project.trimTenthsMm,
      };

      const snapshot = toPlanInput(input, packCuttingPlan(input), project.updatedAt);
      return repos.transaction(() => repos.plans.replaceForProject(projectId, snapshot));
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
