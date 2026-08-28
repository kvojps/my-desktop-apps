import { BrowserWindow, type IpcMainInvokeEvent } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { BackupService } from '../services/backupService';
import { handle } from './handle';

/**
 * Resolve a janela que disparou o canal, para o diálogo nativo travar a certa.
 * `event.sender` é fronteira de IPC e não atravessa para o service — ele recebe
 * a janela já resolvida. (`windowFor` ganha arquivo próprio no ticket 06.)
 */
function windowFor(event: IpcMainInvokeEvent): BrowserWindow {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    throw new Error('No BrowserWindow associated with this IPC event');
  }
  return window;
}

export function registerBackupHandlers(backup: BackupService): void {
  handle(IPC_CHANNELS.dataExport, (event) => backup.exportTo(windowFor(event)));
  handle(IPC_CHANNELS.dataImport, (event) => backup.importFrom(windowFor(event)));
  handle(IPC_CHANNELS.dataOpenFolder, () => backup.openDataFolder());
}
