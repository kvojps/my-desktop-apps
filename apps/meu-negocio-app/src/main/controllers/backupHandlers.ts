import type Database from 'better-sqlite3';
import { BrowserWindow, type IpcMainInvokeEvent } from 'electron';
import type { BackupData, ExportResult, ImportResult } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { Repositories } from '../infra/database';
import { exportData, importData } from '../infra/database/repositories/backupRepository';
import { dialogs } from '../infra/gateways/system/dialogs';
import { fileSystem } from '../infra/gateways/system/fileSystem';
import { shellGateway } from '../infra/gateways/system/shell';
import { handle } from './handle';
import { backupSchema } from './schemas/backup.schema';

function windowFor(event: IpcMainInvokeEvent): BrowserWindow {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    throw new Error('No BrowserWindow associated with this IPC event');
  }
  return window;
}

export function registerBackupHandlers(db: Database.Database, repos: Repositories): void {
  handle(IPC_CHANNELS.dataExport, async (event): Promise<ExportResult> => {
    const defaultPath = `meu-negocio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const filePath = await dialogs.showSaveDialog(windowFor(event), defaultPath);
    if (!filePath) {
      return { success: false, error: 'canceled' };
    }

    const data = exportData(repos);
    await fileSystem.writeFile(filePath, JSON.stringify(data, null, 2));
    return { success: true, filePath };
  });

  handle(IPC_CHANNELS.dataImport, async (event): Promise<ImportResult> => {
    const filePath = await dialogs.showOpenDialog(windowFor(event));
    if (!filePath) {
      return { success: false, error: 'canceled' };
    }

    let raw: string;
    try {
      raw = await fileSystem.readFile(filePath);
    } catch {
      return { success: false, error: 'read-failed' };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { success: false, error: 'invalid-json' };
    }

    const validated = backupSchema.safeParse(parsed);
    if (!validated.success) {
      return { success: false, error: 'invalid-format' };
    }

    importData(db, validated.data as BackupData);
    return { success: true };
  });

  handle(IPC_CHANNELS.dataOpenFolder, async () => {
    await shellGateway.openDataFolder();
  });
}
