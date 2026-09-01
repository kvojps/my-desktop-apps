import { type IpcMainInvokeEvent, dialog } from 'electron';
import fs from 'node:fs/promises';
import type { ExportResult } from '@shared/ipc/api';
import { windowFor } from '../controllers/windowFor';
import { planExportFileName } from '../domain/planExportFileName';
import type { Repositories } from '../infra/database';
import { AppError } from '../utils/errors/AppError';
import { errorReason } from '../utils/errors/errorReason';

/**
 * O plano como arquivo: PNG para o celular do ajudante, PDF para arquivar junto
 * do orçamento.
 *
 * As duas saídas dividem tudo que é do main — o diálogo modal da janela, o nome
 * sugerido e a gravação — e diferem só no que chega até aqui. O PNG vem pronto
 * do renderer, porque o desenho é dele; o PDF é **impresso** desta janela, e o
 * layout sai de graça: é o mesmo `@media print` do papel, de modo que o arquivo
 * arquivado e a folha da bancada são o mesmo documento (design system, §5.6).
 *
 * Nenhum dos dois manda o plano por IPC para ser redesenhado aqui. Um segundo
 * desenho é um desenho que pode divergir do que está à vista, e o que se
 * arquiva junto do orçamento tem de ser o que foi para a máquina.
 */

type ExportFormat = 'png' | 'pdf';

/** O que o diálogo de salvar oferece em cada formato. */
const FILTERS: Record<ExportFormat, { name: string; extensions: string[] }> = {
  png: { name: 'Imagem PNG', extensions: ['png'] },
  pdf: { name: 'Documento PDF', extensions: ['pdf'] },
};

/**
 * Onde salvar, perguntado sobre a janela que pediu — com o nome sugerido lido
 * do banco, e não recebido do renderer: quem exporta escolhe o formato e a
 * pasta, não a identidade do arquivo.
 *
 * `null` é o usuário tendo fechado o diálogo. Cancelar sobe como resultado até
 * a tela, e não como exceção: foi o usuário que respondeu, e o app não tem o
 * que lhe informar de volta.
 */
async function askWhereToSave(
  event: IpcMainInvokeEvent,
  repos: Repositories,
  projectId: string,
  format: ExportFormat,
): Promise<string | null> {
  const project = repos.projects.findById(projectId);
  if (!project) throw new AppError(404, 'Este projeto não existe mais.');

  const plan = repos.plans.findByProject(projectId);
  // Exportar sem plano não acontece pela tela — o botão vive na prancheta —,
  // e por IPC seria um arquivo do nada.
  if (!plan) throw new AppError(404, 'Este projeto ainda não tem um plano gerado.');

  const result = await dialog.showSaveDialog(windowFor(event), {
    title: 'Exportar plano de corte',
    defaultPath: planExportFileName(project.name, plan.generatedAt, format),
    filters: [FILTERS[format]],
  });

  return result.canceled || !result.filePath ? null : result.filePath;
}

/**
 * A gravação, com a falha classificada como falha **de exportação**.
 *
 * Sem o código próprio, um `EACCES` daqui seria classificado como problema da
 * pasta de dados do app, e a tela mandaria o usuário conferir permissões de uma
 * pasta que não é a que ele acabou de escolher.
 */
async function writeExported(filePath: string, data: Uint8Array): Promise<ExportResult> {
  try {
    await fs.writeFile(filePath, data);
  } catch (err) {
    throw new AppError(500, `Falha ao gravar o arquivo: ${errorReason(err)}`, 'export-failed');
  }

  return { success: true, filePath };
}

export async function exportPlanPng(
  event: IpcMainInvokeEvent,
  repos: Repositories,
  projectId: string,
  bytes: Uint8Array,
): Promise<ExportResult> {
  const filePath = await askWhereToSave(event, repos, projectId, 'png');
  if (!filePath) return { success: false, error: 'canceled' };

  return writeExported(filePath, bytes);
}

export async function exportPlanPdf(
  event: IpcMainInvokeEvent,
  repos: Repositories,
  projectId: string,
): Promise<ExportResult> {
  const filePath = await askWhereToSave(event, repos, projectId, 'pdf');
  if (!filePath) return { success: false, error: 'canceled' };

  let pdf: Buffer;
  try {
    pdf = await event.sender.printToPDF({
      // O `@page` do renderer manda: A4 deitada com 10 mm de margem, a mesma
      // folha que sai da impressora. `landscape` fica aqui como piso, para o
      // caso de a página não declarar tamanho — uma folha em pé desenharia a
      // chapa com pouco mais da metade do tamanho.
      preferCSSPageSize: true,
      landscape: true,
      // A folha não tem cor de fundo (§5.6): o desenho é traço e preenchimento
      // de SVG, que saem de qualquer jeito.
      printBackground: false,
    });
  } catch (err) {
    // Montar o PDF é a etapa **antes** de gravar, e falha nela por razões que
    // não são as da gravação: a janela é que não entregou a folha. Mandar o
    // usuário conferir espaço em disco aqui o faria procurar no lugar errado.
    throw new AppError(500, `Falha ao gerar o PDF: ${errorReason(err)}`, 'pdf-failed');
  }

  return writeExported(filePath, pdf);
}
