import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { Sheet } from '@shared/types/sheet';
import type { SheetsService } from '../services/sheetsService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { sheetToResponse } from './responses/sheet.response';
import { sheetInputSchema } from './schemas/sheets.schema';

/**
 * As chapas de um projeto. Mesma forma do `piecesController`, sem a régua da
 * rejeição — excluir uma chapa pode rejeitar uma peça aceita no cadastro, e é o
 * empacotador que a classifica de novo. O carimbo do projeto e a transação são
 * do `sheetsService`; aqui ficam `parseOrThrow` / `parseId` na entrada e
 * `sheetToResponse` na saída.
 */
export function registerSheetsController(sheets: SheetsService): void {
  handle(IPC_CHANNELS.sheetsList, (_event, projectId: unknown): Sheet[] =>
    sheets.list(parseId(projectId)).map(sheetToResponse),
  );

  handle(IPC_CHANNELS.sheetsCreate, (_event, projectId: unknown, data: unknown): Sheet =>
    sheetToResponse(sheets.create(parseId(projectId), parseOrThrow(sheetInputSchema, data))),
  );

  handle(IPC_CHANNELS.sheetsUpdate, (_event, id: unknown, data: unknown): Sheet =>
    sheetToResponse(sheets.update(parseId(id), parseOrThrow(sheetInputSchema, data))),
  );

  handle(IPC_CHANNELS.sheetsDelete, (_event, id: unknown): void => {
    sheets.delete(parseId(id));
  });
}
