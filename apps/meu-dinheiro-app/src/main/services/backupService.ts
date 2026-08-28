import type { ExportResult, ImportResult } from '@shared/ipc/api';
import type { Repositories } from '../infra/database';
import { exportData, parseBackupData } from '../infra/database/repositories/backupRepository';
import type { BackupArchiveGateway } from '../infra/gateways/backupArchive';
import type { DialogParentWindow, DialogsGateway } from '../infra/gateways/system/dialogs';
import type { ShellGateway } from '../infra/gateways/system/shell';
import { LAST_CURRENT_MONTH_KEY, type MonthsService } from './monthsService';

/**
 * Exportar e importar o banco inteiro num `.zip` (`data.json` + `uploads/`). A
 * orquestração — diálogo nativo, disco, o pack/unpack e a tradução de cada falha
 * para `ExportResult`/`ImportResult` — morava dividida entre um repositório e um
 * handler de IPC; aqui é uma camada.
 *
 * `exportData`/`parseBackupData` seguem em `infra/database/` (leitura e
 * conferência de forma, com a tolerância a backups legados); o `.zip` e o
 * diretório temporário são gateway. Depende do `monthsService` porque o
 * pós-import precisa garantir o Mês corrente do conjunto de dados novo
 * (service→service, precedente `prsService`→`reposService`; spec, decisão 12).
 */
export function makeBackupService(
  repos: Repositories,
  months: MonthsService,
  archive: BackupArchiveGateway,
  dialogs: DialogsGateway,
  shell: ShellGateway,
  uploadsDir: string,
) {
  return {
    /**
     * A janela vem de fora porque só o controller a conhece (resolvida do
     * `event.sender`, fronteira de IPC). Daqui é um valor opaco de passagem.
     */
    async exportTo(parent: DialogParentWindow): Promise<ExportResult> {
      const defaultPath = `export-meu-dinheiro-${new Date().toISOString().slice(0, 10)}.zip`;
      const filePath = await dialogs.showSaveDialog(parent, defaultPath);
      if (!filePath) return { success: false, error: 'canceled' };

      await archive.write(filePath, JSON.stringify(exportData(repos), null, 2), uploadsDir);
      return { success: true, filePath };
    },

    async importFrom(parent: DialogParentWindow): Promise<ImportResult> {
      const filePath = await dialogs.showOpenDialog(parent);
      if (!filePath) return { success: false, error: 'canceled' };

      let extracted;
      try {
        extracted = await archive.extract(filePath);
      } catch {
        return {
          success: false,
          error: 'invalid-format',
          message: 'Não foi possível ler o arquivo de backup',
        };
      }

      try {
        const data = parseBackupData(extracted.data);
        if (!data) {
          return { success: false, error: 'invalid-format', message: 'Formato de dados inválido' };
        }

        repos.importBackup(data);
        extracted.restoreUploads(uploadsDir);
      } finally {
        extracted.cleanup();
      }

      // Outro conjunto de dados: a marca de Competência do anterior não vale mais.
      repos.appSettings.deleteAppSetting(LAST_CURRENT_MONTH_KEY);
      months.ensureCurrentMonth();

      return { success: true };
    },

    openDataFolder(): Promise<void> {
      return shell.openDataFolder();
    },
  };
}

export type BackupService = ReturnType<typeof makeBackupService>;
