import { ipcMain } from 'electron';
import { shouldNotifyDataChanged } from '@shared/ipc/channels';
import { toIpcError } from '../utils/errors/toIpcError';
import { notifyDataChanged } from './notifyDataChanged';

type IpcListener = Parameters<typeof ipcMain.handle>[1];

/**
 * Substitui `ipcMain.handle` para que toda falha chegue ao renderer com um
 * código classificado (banco inacessível, corrompido, sem permissão...) e para
 * que toda escrita bem-sucedida avise o renderer de que os dados mudaram.
 *
 * O aviso mora aqui porque este é o único caminho de entrada do IPC: nenhum
 * handler usa `ipcMain.handle` direto. É o que torna impossível esquecer de
 * invalidar um domínio depois de gravá-lo. Falha não avisa — as escritas
 * compostas rodam em `db.transaction`, então erro é rollback.
 */
export function handle(channel: string, listener: IpcListener): void {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      const result = await listener(event, ...args);
      if (shouldNotifyDataChanged(channel)) notifyDataChanged();
      return result;
    } catch (err) {
      throw toIpcError(err);
    }
  });
}
