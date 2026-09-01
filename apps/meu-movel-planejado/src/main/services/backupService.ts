import type { ExportResult, ImportResult } from '@shared/ipc/api';
import type { AppInfo } from '@shared/types/appInfo';
import { backupFileName } from '../domain/backupFileName';
import type { Repositories } from '../infra/database';
import { BACKUP_REFUSAL_MESSAGES, readBackupFile } from '../infra/database/readBackupFile';
import type { AppInfoGateway } from '../infra/gateways/system/appInfo';
import type {
  DialogFileType,
  DialogParentWindow,
  DialogsGateway,
} from '../infra/gateways/system/dialogs';
import type { FileSystemGateway } from '../infra/gateways/system/fileSystem';
import type { ShellGateway } from '../infra/gateways/system/shell';
import { AppError } from '../utils/errors/AppError';
import { errorReason } from '../utils/errors/errorReason';

/**
 * Os quatro canais `data:*`: exportar o banco para um arquivo, importar de
 * volta, os dados de build da tela de Configurações e abrir a pasta de dados
 * (spec, decisão 16 — o nome não casa com o prefixo do canal, e a consistência
 * com o `meu-negocio-app` e o `meu-dinheiro-app` vale mais).
 *
 * Os gateways chegam por parâmetro pelo motivo de sempre nos de `system/`: falam
 * Electron. O formato do arquivo mora no schema, a conferência em
 * `readBackupFile` e a gravação de linhas cruas no repositório; o que sobra aqui
 * é costurar essas peças com o disco e o diálogo e traduzir cada desfecho para o
 * que a tela entende.
 */

const FILE_TYPE: DialogFileType = { name: 'Backup do Meu Móvel Planejado', extensions: ['json'] };

export function makeBackupService(
  repos: Repositories,
  fileSystem: FileSystemGateway,
  dialogs: DialogsGateway,
  shell: ShellGateway,
  appInfo: AppInfoGateway,
) {
  return {
    async exportTo(window: DialogParentWindow): Promise<ExportResult> {
      const filePath = await dialogs.showSaveDialog(window, {
        title: 'Exportar dados',
        defaultPath: backupFileName(new Date()),
        fileTypes: [FILE_TYPE],
      });

      // Cancelar sobe como resultado, e não como exceção: foi o usuário que
      // respondeu, e o app não tem o que lhe informar de volta.
      if (!filePath) return { success: false, error: 'canceled' };

      const data = repos.backup.exportRows();

      try {
        // Indentado: o arquivo é do usuário, fica no pen drive dele e é a última
        // cópia que resta se o banco se perder. Legível é o que permite conferir,
        // e no limite recuperar à mão, o que o app não conseguir mais importar.
        await fileSystem.writeFile(filePath, JSON.stringify(data, null, 2));
      } catch (err) {
        // Código próprio: sem ele, um `EACCES` daqui seria classificado como
        // problema da pasta de dados do app, e a tela mandaria o usuário
        // conferir permissões de uma pasta que não é a que ele acabou de
        // escolher.
        throw new AppError(500, `Falha ao gravar o arquivo: ${errorReason(err)}`, 'export-failed');
      }

      return { success: true, filePath };
    },

    async importFrom(window: DialogParentWindow): Promise<ImportResult> {
      const filePath = await dialogs.showOpenDialog(window, {
        title: 'Importar dados',
        fileTypes: [FILE_TYPE],
      });

      if (!filePath) return { success: false, error: 'canceled' };

      let raw: string;
      try {
        raw = await fileSystem.readFile(filePath);
      } catch (err) {
        throw new AppError(500, `Falha ao ler o arquivo: ${errorReason(err)}`, 'import-failed');
      }

      // `400` de propósito: a recusa vira `invalid-input`, e é o único código
      // cuja mensagem o renderer exibe literalmente. É assim que a mensagem
      // própria de cada motivo chega inteira à tela, em vez de virar "falha ao
      // ler os dados".
      const conferred = readBackupFile(raw);
      if (!conferred.ok) throw new AppError(400, BACKUP_REFUSAL_MESSAGES[conferred.refusal]);

      try {
        repos.transaction(() => repos.backup.importRows(conferred.file));
      } catch (err) {
        // O que o banco recusa aqui é o arquivo, não o app: chave estrangeira
        // órfã, coluna obrigatória vazia. A gravação é uma transação só, então a
        // recusa pode prometer que nada foi alterado — e é essa promessa que
        // torna a ação irreversível oferecível.
        if (err instanceof AppError) throw err;
        throw new AppError(
          400,
          `O backup está inconsistente e não foi importado: ${errorReason(err)}`,
        );
      }

      return { success: true };
    },

    /**
     * Versão pelo gateway (não pelo `package.json` importado: em produção quem
     * sabe a versão instalada é o Electron) e `dbPath` pelo gateway (estado do
     * processo, fixado no `initDb`). `getAppInfo` para não sombrear o gateway
     * `appInfo` injetado, e para casar com o verbo do `meu-negocio-app`.
     */
    getAppInfo(): AppInfo {
      return { version: appInfo.version(), dbPath: appInfo.dbPath() };
    },

    openDataFolder(): Promise<void> {
      return shell.openDataFolder();
    },
  };
}

export type BackupService = ReturnType<typeof makeBackupService>;
