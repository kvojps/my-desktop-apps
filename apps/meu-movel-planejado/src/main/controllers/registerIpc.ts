import type Database from 'better-sqlite3';
import { app, shell } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import { PIECE_DOES_NOT_FIT_MESSAGE, fitsAnySheet } from '@shared/nesting/fit';
import type { AppInfo } from '@shared/types/appInfo';
import type { PieceInput } from '@shared/types/piece';
import type { ThemeMode } from '@shared/types/theme';
import { type Repositories, makeRepositories } from '../infra/database';
import { getDbPath } from '../infra/database/connection';
import { printDocument } from '../infra/gateways/system/printing';
import { exportBackupFile, importBackupFile } from '../services/backupService';
import { exportPlanPdf, exportPlanPng } from '../services/plansService';
import { AppError } from '../utils/errors/AppError';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { pngBytesSchema } from './schemas/export.schema';
import { pieceInputSchema } from './schemas/piece.schema';
import { planInputSchema } from './schemas/plan.schema';
import { cuttingParamsInputSchema, projectInputSchema } from './schemas/project.schema';
import { sheetInputSchema } from './schemas/sheet.schema';
import { themeModeSchema } from './schemas/theme.schema';

interface RegisterIpcOptions {
  /** Aplica o novo modo ao que só o main controla, além de persistir. */
  onThemeModeChange: (mode: ThemeMode) => void;
}

const PROJECT_GONE = 'Este projeto não existe mais.';
const PIECE_GONE = 'Esta peça não existe mais.';
const SHEET_GONE = 'Esta chapa não existe mais.';

/**
 * A régua da rejeição, ainda composta aqui: peça maior que qualquer chapa do
 * projeto é barrada no cadastro, na fronteira de confiança e não só no
 * formulário. A régua é a mesma que o empacotador usa (`shared/nesting/fit`) —
 * duas contas concordando por coincidência divergiriam no dia em que a
 * aritmética do kerf mudasse.
 *
 * Projeto inexistente não é assunto desta régua: o `projects.touch` da
 * transação devolve o 404 logo adiante. O ticket 05 move esta checagem para
 * `piecesService`, que confere o projeto **antes** de abrir a transação.
 */
function assertPieceFits(repos: Repositories, projectId: string, data: PieceInput): void {
  const project = repos.projects.findById(projectId);
  if (!project) return;
  if (fitsAnySheet(data, repos.sheets.listForProject(projectId), project)) return;
  // 422 e não 404: o dado é que não serve, e `classifyError` o traduz em
  // `invalid-input`, que é o código cuja mensagem chega inteira à tela.
  throw new AppError(422, PIECE_DOES_NOT_FIT_MESSAGE);
}

/**
 * `registerIpc.ts` ainda faz as vezes de controller: validação inline, saída
 * como entidade e, enquanto não há service (ticket 05), a composição das
 * escritas multi-tabela sobre `repos.transaction` e a tradução do `null`/`false`
 * dos repositórios de volta para `AppError(404)` nos pontos que já se
 * comportavam assim.
 */
export function registerIpcHandlers(db: Database.Database, options: RegisterIpcOptions): void {
  const repos = makeRepositories(db);

  handle(IPC_CHANNELS.projectsList, () => repos.projects.list());

  handle(IPC_CHANNELS.projectsGet, (_event, id: unknown) => repos.projects.findById(parseId(id)));

  handle(IPC_CHANNELS.projectsCreate, (_event, data: unknown) =>
    repos.projects.create(parseOrThrow(projectInputSchema, data)),
  );

  handle(IPC_CHANNELS.projectsUpdate, (_event, id: unknown, data: unknown) => {
    const updated = repos.projects.update(parseId(id), parseOrThrow(projectInputSchema, data));
    if (!updated) throw new AppError(404, PROJECT_GONE);
    return updated;
  });

  handle(IPC_CHANNELS.projectsUpdateCuttingParams, (_event, id: unknown, data: unknown) => {
    const updated = repos.projects.updateCuttingParams(
      parseId(id),
      parseOrThrow(cuttingParamsInputSchema, data),
    );
    if (!updated) throw new AppError(404, PROJECT_GONE);
    return updated;
  });

  handle(IPC_CHANNELS.projectsDelete, (_event, id: unknown) => {
    if (!repos.projects.delete(parseId(id))) throw new AppError(404, PROJECT_GONE);
  });

  handle(IPC_CHANNELS.piecesList, (_event, projectId: unknown) =>
    repos.pieces.listForProject(parseId(projectId)),
  );

  // Cadastrar peça também move o carimbo do projeto, e as duas escritas são uma
  // transação só: um carimbo antigo com peça nova é exatamente o estado em que o
  // app diria que o plano continua em dia quando ele não está.
  handle(IPC_CHANNELS.piecesCreate, (_event, projectId: unknown, data: unknown) => {
    const id = parseId(projectId);
    const input = parseOrThrow(pieceInputSchema, data);
    assertPieceFits(repos, id, input);
    return repos.transaction(() => {
      if (!repos.projects.touch(id)) throw new AppError(404, PROJECT_GONE);
      return repos.pieces.create(id, input);
    });
  });

  handle(IPC_CHANNELS.piecesUpdate, (_event, id: unknown, data: unknown) => {
    const pieceId = parseId(id);
    const input = parseOrThrow(pieceInputSchema, data);
    const current = repos.pieces.findById(pieceId);
    if (!current) throw new AppError(404, PIECE_GONE);
    assertPieceFits(repos, current.projectId, input);
    return repos.transaction(() => {
      repos.projects.touch(current.projectId);
      const updated = repos.pieces.update(pieceId, input);
      if (!updated) throw new AppError(404, PIECE_GONE);
      return updated;
    });
  });

  handle(IPC_CHANNELS.piecesDelete, (_event, id: unknown) => {
    const pieceId = parseId(id);
    const current = repos.pieces.findById(pieceId);
    if (!current) throw new AppError(404, PIECE_GONE);
    repos.transaction(() => {
      repos.projects.touch(current.projectId);
      repos.pieces.delete(pieceId);
    });
  });

  handle(IPC_CHANNELS.sheetsList, (_event, projectId: unknown) =>
    repos.sheets.listForProject(parseId(projectId)),
  );

  handle(IPC_CHANNELS.sheetsCreate, (_event, projectId: unknown, data: unknown) => {
    const id = parseId(projectId);
    const input = parseOrThrow(sheetInputSchema, data);
    return repos.transaction(() => {
      if (!repos.projects.touch(id)) throw new AppError(404, PROJECT_GONE);
      return repos.sheets.create(id, input);
    });
  });

  handle(IPC_CHANNELS.sheetsUpdate, (_event, id: unknown, data: unknown) => {
    const sheetId = parseId(id);
    const input = parseOrThrow(sheetInputSchema, data);
    const current = repos.sheets.findById(sheetId);
    if (!current) throw new AppError(404, SHEET_GONE);
    return repos.transaction(() => {
      repos.projects.touch(current.projectId);
      const updated = repos.sheets.update(sheetId, input);
      if (!updated) throw new AppError(404, SHEET_GONE);
      return updated;
    });
  });

  handle(IPC_CHANNELS.sheetsDelete, (_event, id: unknown) => {
    const sheetId = parseId(id);
    const current = repos.sheets.findById(sheetId);
    if (!current) throw new AppError(404, SHEET_GONE);
    repos.transaction(() => {
      repos.projects.touch(current.projectId);
      repos.sheets.delete(sheetId);
    });
  });

  handle(IPC_CHANNELS.plansGet, (_event, projectId: unknown) =>
    repos.plans.findByProject(parseId(projectId)),
  );

  // Gravar o plano recém-gerado substitui o vigente numa transação só: o
  // `DELETE` leva as chapas planejadas, as colocações e os dois lotes de fora
  // por cascata, e uma falha no meio devolve o plano anterior intacto.
  handle(IPC_CHANNELS.plansSave, (_event, projectId: unknown, data: unknown) => {
    const id = parseId(projectId);
    const input = parseOrThrow(planInputSchema, data);
    if (!repos.projects.exists(id)) throw new AppError(404, PROJECT_GONE);
    return repos.transaction(() => repos.plans.replaceForProject(id, input));
  });

  // O documento é o que a janela já tem desenhado, então o handler recebe o
  // `WebContents` de quem pediu e nada mais.
  handle(IPC_CHANNELS.plansPrint, (event) => printDocument(event.sender));

  // O projeto entra por id, e não por nome: o nome sugerido do arquivo é lido
  // do banco aqui, para que o renderer não escolha como o arquivo se chama.
  handle(IPC_CHANNELS.plansExportPng, (event, projectId: unknown, bytes: unknown) =>
    exportPlanPng(event, repos, parseId(projectId), parseOrThrow(pngBytesSchema, bytes)),
  );

  handle(IPC_CHANNELS.plansExportPdf, (event, projectId: unknown) =>
    exportPlanPdf(event, repos, parseId(projectId)),
  );

  handle(IPC_CHANNELS.dataExport, (event) => exportBackupFile(event, repos));

  handle(IPC_CHANNELS.dataImport, (event) => importBackupFile(event, repos));

  // A versão vem do `app`, e não do `package.json` importado: em produção quem
  // sabe a versão instalada é o Electron, e ler o manifesto empacotado devolveria
  // a versão de quem construiu, não a de quem está rodando.
  handle(IPC_CHANNELS.dataAppInfo, (): AppInfo => ({
    version: app.getVersion(),
    dbPath: getDbPath(),
  }));

  handle(IPC_CHANNELS.dataOpenFolder, async () => {
    await shell.openPath(app.getPath('userData'));
  });

  handle(IPC_CHANNELS.themeSet, (_event, data: unknown) => {
    options.onThemeModeChange(parseOrThrow(themeModeSchema, data));
  });
}
