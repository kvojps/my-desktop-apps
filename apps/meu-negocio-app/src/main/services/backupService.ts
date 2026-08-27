import type { ExportResult, ImportResult } from '@shared/ipc/api';
import type { Repositories } from '../infra/database';
import { exportData, parseBackupData } from '../infra/database/repositories/backupRepository';
import type { DialogParentWindow, DialogsGateway } from '../infra/gateways/system/dialogs';
import type { FileSystemGateway } from '../infra/gateways/system/fileSystem';
import type { ShellGateway } from '../infra/gateways/system/shell';

/**
 * Exportar e importar o banco inteiro em JSON. A orquestração — diálogo nativo,
 * disco, o `JSON.parse` e a escolha do formato de erro que o usuário vê — morava
 * no handler de IPC; aqui ela é uma camada.
 *
 * Os três gateways chegam por parâmetro pelo motivo de sempre nos de `system/`:
 * falam Electron. `exportData`/`parseBackupData`/`importData` seguem em
 * `infra/database/` — leitura, conferência de forma e escrita de linhas cruas;
 * este service não conhece zod (README §2.2), só costura essas peças com o disco
 * e o diálogo e traduz cada falha para o `ImportResult`.
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

      const data = parseBackupData(parsed);
      if (!data) {
        return { success: false, error: 'invalid-format' };
      }

      repos.importBackup(data);
      return { success: true };
    },

    openDataFolder(): Promise<void> {
      return shell.openDataFolder();
    },
  };
}

export type BackupService = ReturnType<typeof makeBackupService>;
