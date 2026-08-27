import type Database from 'better-sqlite3';
import { BrowserWindow, type IpcMainInvokeEvent, app, dialog, shell } from 'electron';
import type { ExportResult, ImportResult } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import { deleteAppSetting } from '../infra/database/repositories/appSettingsRepository';
import {
  exportToZipFile,
  importFromZipFile,
} from '../infra/database/repositories/backupRepository';
import {
  LAST_CURRENT_MONTH_KEY,
  ensureCurrentMonthExists,
} from '../infra/database/repositories/monthsRepository';
import { AppError } from '../utils/errors/AppError';
import { handle } from './handle';

function windowFor(event: IpcMainInvokeEvent): BrowserWindow {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    throw new Error('No BrowserWindow associated with this IPC event');
  }
  return window;
}

export function registerBackupHandlers(db: Database.Database, uploadsDir: string): void {
  handle(IPC_CHANNELS.dataExport, async (event): Promise<ExportResult> => {
    const defaultPath = `export-meu-dinheiro-${new Date().toISOString().slice(0, 10)}.zip`;
    const result = await dialog.showSaveDialog(windowFor(event), {
      title: 'Exportar dados',
      defaultPath,
      filters: [{ name: 'ZIP', extensions: ['zip'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'canceled' };
    }

    await exportToZipFile(db, uploadsDir, result.filePath);
    return { success: true, filePath: result.filePath };
  });

  handle(IPC_CHANNELS.dataImport, async (event): Promise<ImportResult> => {
    const result = await dialog.showOpenDialog(windowFor(event), {
      title: 'Importar dados',
      filters: [{ name: 'ZIP', extensions: ['zip'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'canceled' };
    }

    try {
      await importFromZipFile(db, uploadsDir, result.filePaths[0]);
    } catch (err) {
      const message = err instanceof AppError ? err.message : 'Erro ao importar dados';
      return { success: false, error: 'invalid-format', message };
    }

    // Outro conjunto de dados: a marca de competência do anterior não vale mais.
    deleteAppSetting(db, LAST_CURRENT_MONTH_KEY);
    ensureCurrentMonthExists(db);

    return { success: true };
  });

  handle(IPC_CHANNELS.dataOpenFolder, async () => {
    const failure = await shell.openPath(app.getPath('userData'));
    if (failure) {
      throw new AppError(500, failure);
    }
  });
}
