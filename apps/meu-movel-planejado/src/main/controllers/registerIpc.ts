import type Database from 'better-sqlite3';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import { makeRepositories } from '../infra/database';
import { appInfo } from '../infra/gateways/system/appInfo';
import { dialogs } from '../infra/gateways/system/dialogs';
import { fileSystem } from '../infra/gateways/system/fileSystem';
import { printing } from '../infra/gateways/system/printing';
import { shellGateway } from '../infra/gateways/system/shell';
import { themeMode } from '../infra/gateways/system/themeMode';
import { makeBackupService } from '../services/backupService';
import { makePiecesService } from '../services/piecesService';
import { makePlansService } from '../services/plansService';
import { makeProjectsService } from '../services/projectsService';
import { makeSettingsService } from '../services/settingsService';
import { makeSheetsService } from '../services/sheetsService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { pngBytesSchema } from './schemas/export.schema';
import { pieceInputSchema } from './schemas/piece.schema';
import { planInputSchema } from './schemas/plan.schema';
import { cuttingParamsInputSchema, projectInputSchema } from './schemas/project.schema';
import { sheetInputSchema } from './schemas/sheet.schema';
import { themeModeSchema } from './schemas/theme.schema';
import { windowFor } from './windowFor';

/**
 * `registerIpc.ts` ainda faz as vezes de controller: validação inline com os
 * schemas de `schemas/` e saída como entidade, sem mapper. O que mudou no ticket
 * 05 é que ele agora **compõe e chama services** — a régua da rejeição, os 404 e
 * as transações multi-tabela moraram aqui provisoriamente (ticket 03) e agora
 * estão na camada de serviço. Quem o parte em controllers de verdade, com
 * `responses/` e o `handle` estreitado, é o ticket 06.
 *
 * A composição é rasa: nenhum service depende de outro, só de `repos` e dos
 * gateways de que precisa.
 */
export function registerIpcHandlers(db: Database.Database): void {
  const repos = makeRepositories(db);

  const projects = makeProjectsService(repos);
  const pieces = makePiecesService(repos);
  const sheets = makeSheetsService(repos);
  const plans = makePlansService(repos, fileSystem, dialogs, printing);
  const backup = makeBackupService(repos, fileSystem, dialogs, shellGateway, appInfo);
  const settings = makeSettingsService(repos, themeMode);

  handle(IPC_CHANNELS.projectsList, () => projects.list());
  handle(IPC_CHANNELS.projectsGet, (_event, id: unknown) => projects.get(parseId(id)));
  handle(IPC_CHANNELS.projectsCreate, (_event, data: unknown) =>
    projects.create(parseOrThrow(projectInputSchema, data)),
  );
  handle(IPC_CHANNELS.projectsUpdate, (_event, id: unknown, data: unknown) =>
    projects.update(parseId(id), parseOrThrow(projectInputSchema, data)),
  );
  handle(IPC_CHANNELS.projectsUpdateCuttingParams, (_event, id: unknown, data: unknown) =>
    projects.updateCuttingParams(parseId(id), parseOrThrow(cuttingParamsInputSchema, data)),
  );
  handle(IPC_CHANNELS.projectsDelete, (_event, id: unknown) => projects.delete(parseId(id)));

  handle(IPC_CHANNELS.piecesList, (_event, projectId: unknown) => pieces.list(parseId(projectId)));
  handle(IPC_CHANNELS.piecesCreate, (_event, projectId: unknown, data: unknown) =>
    pieces.create(parseId(projectId), parseOrThrow(pieceInputSchema, data)),
  );
  handle(IPC_CHANNELS.piecesUpdate, (_event, id: unknown, data: unknown) =>
    pieces.update(parseId(id), parseOrThrow(pieceInputSchema, data)),
  );
  handle(IPC_CHANNELS.piecesDelete, (_event, id: unknown) => pieces.delete(parseId(id)));

  handle(IPC_CHANNELS.sheetsList, (_event, projectId: unknown) => sheets.list(parseId(projectId)));
  handle(IPC_CHANNELS.sheetsCreate, (_event, projectId: unknown, data: unknown) =>
    sheets.create(parseId(projectId), parseOrThrow(sheetInputSchema, data)),
  );
  handle(IPC_CHANNELS.sheetsUpdate, (_event, id: unknown, data: unknown) =>
    sheets.update(parseId(id), parseOrThrow(sheetInputSchema, data)),
  );
  handle(IPC_CHANNELS.sheetsDelete, (_event, id: unknown) => sheets.delete(parseId(id)));

  handle(IPC_CHANNELS.plansGet, (_event, projectId: unknown) => plans.get(parseId(projectId)));
  // `plans:save` é provisório — o ticket 07 o troca por `plans:generate`.
  handle(IPC_CHANNELS.plansSave, (_event, projectId: unknown, data: unknown) =>
    plans.save(parseId(projectId), parseOrThrow(planInputSchema, data)),
  );
  handle(IPC_CHANNELS.plansPrint, (event) => plans.print(windowFor(event)));
  handle(IPC_CHANNELS.plansExportPng, (event, projectId: unknown, bytes: unknown) =>
    plans.exportPng(windowFor(event), parseId(projectId), parseOrThrow(pngBytesSchema, bytes)),
  );
  handle(IPC_CHANNELS.plansExportPdf, (event, projectId: unknown) =>
    plans.exportPdf(windowFor(event), parseId(projectId)),
  );

  handle(IPC_CHANNELS.dataExport, (event) => backup.exportTo(windowFor(event)));
  handle(IPC_CHANNELS.dataImport, (event) => backup.importFrom(windowFor(event)));
  handle(IPC_CHANNELS.dataAppInfo, () => backup.getAppInfo());
  handle(IPC_CHANNELS.dataOpenFolder, () => backup.openDataFolder());

  handle(IPC_CHANNELS.themeSet, (_event, data: unknown) => {
    settings.setThemeMode(parseOrThrow(themeModeSchema, data));
  });
}
