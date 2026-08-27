import { BrowserWindow, type IpcMainInvokeEvent } from 'electron';
import type { ExportResult, ImportResult } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { BackupService } from '../services/backupService';
import { handle } from './handle';

function windowFor(event: IpcMainInvokeEvent): BrowserWindow {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    throw new Error('No BrowserWindow associated with this IPC event');
  }
  return window;
}

export function registerBackupHandlers(backup: BackupService): void {
  handle(IPC_CHANNELS.dataExport, (event): Promise<ExportResult> =>
    backup.exportTo(windowFor(event)),
  );

  handle(IPC_CHANNELS.dataImport, (event): Promise<ImportResult> =>
    backup.importFrom(windowFor(event)),
  );

  handle(IPC_CHANNELS.dataOpenFolder, (): Promise<void> => backup.openDataFolder());
}
