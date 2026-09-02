import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { Piece } from '@shared/types/piece';
import type { PiecesService } from '../services/piecesService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { pieceToResponse } from './responses/piece.response';
import { pieceInputSchema } from './schemas/pieces.schema';

/**
 * As peças de um projeto. A régua da rejeição (o 422), o carimbo do projeto e a
 * transação são todos do `piecesService`; aqui ficam `parseOrThrow` / `parseId`
 * na entrada e `pieceToResponse` na saída.
 */
export function registerPiecesController(pieces: PiecesService): void {
  handle(IPC_CHANNELS.piecesList, (_event, projectId: unknown): Piece[] =>
    pieces.list(parseId(projectId)).map(pieceToResponse),
  );

  handle(IPC_CHANNELS.piecesCreate, (_event, projectId: unknown, data: unknown): Piece =>
    pieceToResponse(pieces.create(parseId(projectId), parseOrThrow(pieceInputSchema, data))),
  );

  handle(IPC_CHANNELS.piecesUpdate, (_event, id: unknown, data: unknown): Piece =>
    pieceToResponse(pieces.update(parseId(id), parseOrThrow(pieceInputSchema, data))),
  );

  handle(IPC_CHANNELS.piecesDelete, (_event, id: unknown): void => {
    pieces.delete(parseId(id));
  });
}
