import type { ExportResult, ImportResult } from '@shared/ipc/api';
import type { BackupData } from '@shared/types/backup';
import { backupSchema } from '../controllers/schemas/backup.schema';
import type { Repositories } from '../infra/database';
import { exportData } from '../infra/database/repositories/backupRepository';
import type { DialogParentWindow, DialogsGateway } from '../infra/gateways/system/dialogs';
import type { FileSystemGateway } from '../infra/gateways/system/fileSystem';
import type { ShellGateway } from '../infra/gateways/system/shell';

/**
 * Exportar e importar o banco inteiro em JSON. A orquestração — diálogo nativo,
 * disco, parse, validação e a escolha do formato de erro — morava no handler de
 * IPC; aqui ela é uma camada.
 *
 * Os três gateways chegam por parâmetro pelo motivo de sempre nos de `system/`:
 * falam Electron. `exportData`/`importData` seguem em `infra/database/` — são
 * leitura/escrita de linhas cruas, sem regra de negócio; este service só as
 * costura com o disco e o diálogo.
 */
export function makeBackupService(
  repos: Repositories,
  fileSystem: FileSystemGateway,
  dialogs: DialogsGateway,
  shell: ShellGateway,
) {
  return {
    /**
     * A janela vem de fora porque só o controller a conhece (resolvida do
     * `event.sender`, fronteira de IPC). Daqui é um valor opaco de passagem.
     */
    async exportTo(parent: DialogParentWindow): Promise<ExportResult> {
      const defaultPath = `meu-negocio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const filePath = await dialogs.showSaveDialog(parent, defaultPath);
      if (!filePath) {
        return { success: false, error: 'canceled' };
      }

      await fileSystem.writeFile(filePath, JSON.stringify(exportData(repos), null, 2));
      return { success: true, filePath };
    },

    async importFrom(parent: DialogParentWindow): Promise<ImportResult> {
      const filePath = await dialogs.showOpenDialog(parent);
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

      repos.importBackup(validated.data as BackupData);
      return { success: true };
    },

    openDataFolder(): Promise<void> {
      return shell.openDataFolder();
    },
  };
}

export type BackupService = ReturnType<typeof makeBackupService>;
