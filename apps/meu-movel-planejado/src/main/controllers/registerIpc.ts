import type Database from 'better-sqlite3';
import { app, shell } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { AppInfo } from '@shared/types/appInfo';
import type { ThemeMode } from '@shared/types/theme';
import { getDbPath } from '../infra/database/connection';
import {
  createPiece,
  deletePiece,
  listPieces,
  updatePiece,
} from '../infra/database/repositories/piecesRepository';
import { getPlan, savePlan } from '../infra/database/repositories/plansRepository';
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateCuttingParams,
  updateProject,
} from '../infra/database/repositories/projectsRepository';
import {
  createSheet,
  deleteSheet,
  listSheets,
  updateSheet,
} from '../infra/database/repositories/sheetsRepository';
import { printDocument } from '../infra/gateways/system/printing';
import { exportBackupFile, importBackupFile } from '../services/backupService';
import { exportPlanPdf, exportPlanPng } from '../services/plansService';
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

export function registerIpcHandlers(db: Database.Database, options: RegisterIpcOptions): void {
  handle(IPC_CHANNELS.projectsList, () => listProjects(db));

  handle(IPC_CHANNELS.projectsGet, (_event, id: unknown) => getProject(db, parseId(id)));

  handle(IPC_CHANNELS.projectsCreate, (_event, data: unknown) =>
    createProject(db, parseOrThrow(projectInputSchema, data)),
  );

  handle(IPC_CHANNELS.projectsUpdate, (_event, id: unknown, data: unknown) =>
    updateProject(db, parseId(id), parseOrThrow(projectInputSchema, data)),
  );

  handle(IPC_CHANNELS.projectsUpdateCuttingParams, (_event, id: unknown, data: unknown) =>
    updateCuttingParams(db, parseId(id), parseOrThrow(cuttingParamsInputSchema, data)),
  );

  handle(IPC_CHANNELS.projectsDelete, (_event, id: unknown) => deleteProject(db, parseId(id)));

  handle(IPC_CHANNELS.piecesList, (_event, projectId: unknown) =>
    listPieces(db, parseId(projectId)),
  );

  handle(IPC_CHANNELS.piecesCreate, (_event, projectId: unknown, data: unknown) =>
    createPiece(db, parseId(projectId), parseOrThrow(pieceInputSchema, data)),
  );

  handle(IPC_CHANNELS.piecesUpdate, (_event, id: unknown, data: unknown) =>
    updatePiece(db, parseId(id), parseOrThrow(pieceInputSchema, data)),
  );

  handle(IPC_CHANNELS.piecesDelete, (_event, id: unknown) => deletePiece(db, parseId(id)));

  handle(IPC_CHANNELS.sheetsList, (_event, projectId: unknown) =>
    listSheets(db, parseId(projectId)),
  );

  handle(IPC_CHANNELS.sheetsCreate, (_event, projectId: unknown, data: unknown) =>
    createSheet(db, parseId(projectId), parseOrThrow(sheetInputSchema, data)),
  );

  handle(IPC_CHANNELS.sheetsUpdate, (_event, id: unknown, data: unknown) =>
    updateSheet(db, parseId(id), parseOrThrow(sheetInputSchema, data)),
  );

  handle(IPC_CHANNELS.sheetsDelete, (_event, id: unknown) => deleteSheet(db, parseId(id)));

  handle(IPC_CHANNELS.plansGet, (_event, projectId: unknown) => getPlan(db, parseId(projectId)));

  handle(IPC_CHANNELS.plansSave, (_event, projectId: unknown, data: unknown) =>
    savePlan(db, parseId(projectId), parseOrThrow(planInputSchema, data)),
  );

  // O documento é o que a janela já tem desenhado, então o handler recebe o
  // `WebContents` de quem pediu e nada mais.
  handle(IPC_CHANNELS.plansPrint, (event) => printDocument(event.sender));

  // O projeto entra por id, e não por nome: o nome sugerido do arquivo é lido
  // do banco aqui, para que o renderer não escolha como o arquivo se chama.
  handle(IPC_CHANNELS.plansExportPng, (event, projectId: unknown, bytes: unknown) =>
    exportPlanPng(event, db, parseId(projectId), parseOrThrow(pngBytesSchema, bytes)),
  );

  handle(IPC_CHANNELS.plansExportPdf, (event, projectId: unknown) =>
    exportPlanPdf(event, db, parseId(projectId)),
  );

  handle(IPC_CHANNELS.dataExport, (event) => exportBackupFile(event, db));

  handle(IPC_CHANNELS.dataImport, (event) => importBackupFile(event, db));

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
