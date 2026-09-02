import type { ExportResult, ImportResult } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { AppInfo } from '@shared/types/appInfo';
import type { BackupService } from '../services/backupService';
import { handle } from './handle';
import { windowFor } from './windowFor';

/**
 * Os quatro canais `data:*`: exportar o banco inteiro para um arquivo, importar
 * de volta, os dados de build da tela de Configurações e abrir a pasta de dados.
 * O nome não casa com o prefixo do canal — é o desconforto de grep herdado do
 * `meu-negocio-app` e do `meu-dinheiro-app`, aceito por consistência (spec,
 * decisão 16).
 *
 * A orquestração — diálogo nativo, disco, parse, validação e a escolha do
 * formato de erro — é toda do `backupService`; aqui fica a fronteira de IPC:
 * resolver a janela e repassá-la. Nenhum dos quatro devolve entidade de domínio
 * (`ExportResult` / `ImportResult` são uniões de literais de `shared/ipc/`,
 * `AppInfo` é o tipo cru — backup não ganha entidade, decisão 14), então nenhum
 * tem mapper de saída.
 */
export function registerBackupController(backup: BackupService): void {
  handle(IPC_CHANNELS.dataExport, (event): Promise<ExportResult> =>
    backup.exportTo(windowFor(event)),
  );

  handle(IPC_CHANNELS.dataImport, (event): Promise<ImportResult> =>
    backup.importFrom(windowFor(event)),
  );

  handle(IPC_CHANNELS.dataAppInfo, (): AppInfo => backup.getAppInfo());

  handle(IPC_CHANNELS.dataOpenFolder, (): Promise<void> => backup.openDataFolder());
}
