import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { ScanPath } from '@shared/types/scanPath';
import type { ScanPathsService } from '../services/scanPathsService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { createScanPathSchema } from './schemas/scanPath.schema';

/**
 * Os canais dos diretórios cadastrados para varredura.
 *
 * Nenhum dos três decide nada — `scanPaths:getAll` é literalmente uma lista
 * mapeada —, e mesmo assim os três atravessam controller → service →
 * repositório. É o preço de nenhuma camada ser pulável (ADR-0002), pago de
 * olhos abertos: a exceção custaria a propriedade que motivou o desenho.
 *
 * O que é de fato daqui é a fronteira de entrada: `parseOrThrow`, porque o
 * contrato de tipos do preload não sobrevive em runtime. O `ScanPath` que sai
 * já é o tipo final — sem mapper de resposta (ADR-0005).
 */
export function registerScanPathsController(scanPaths: ScanPathsService): void {
  handle(IPC_CHANNELS.scanPathsGetAll, (): ScanPath[] => scanPaths.list());

  handle(IPC_CHANNELS.scanPathsAdd, (_event, data: unknown): ScanPath =>
    scanPaths.create(parseOrThrow(createScanPathSchema, data)),
  );

  handle(IPC_CHANNELS.scanPathsDelete, (_event, id: unknown): void => {
    scanPaths.delete(parseId(id));
  });
}
