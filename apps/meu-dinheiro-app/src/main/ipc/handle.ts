import { ipcMain } from 'electron';
import { toIpcError } from '../errors/toIpcError';

type IpcListener = Parameters<typeof ipcMain.handle>[1];

/**
 * Substitui `ipcMain.handle` para que toda falha chegue ao renderer com um
 * código classificado (banco inacessível, corrompido, sem permissão...).
 */
export function handle(channel: string, listener: IpcListener): void {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return await listener(event, ...args);
    } catch (err) {
      throw toIpcError(err);
    }
  });
}
