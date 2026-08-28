import type { ExportResult, ImportResult } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { BackupService } from '../services/backupService';
import { handle } from './handle';
import { windowFor } from './windowFor';

/**
 * Exportar e importar o banco inteiro num `.zip` (`data.json` + `uploads/`). A
 * orquestração — diálogo nativo, disco, pack/unpack, parse e a escolha do
 * formato de erro — é toda do `backupService`; aqui fica a fronteira de IPC:
 * resolver a janela e repassá-la.
 *
 * Nenhum dos três devolve entidade de domínio — `ExportResult`/`ImportResult`
 * são contratos de `shared/ipc/`, uniões de literais que atravessam por
 * atribuição —, então nenhum tem mapper de saída.
 */
export function registerBackupController(backup: BackupService): void {
  handle(IPC_CHANNELS.dataExport, (event): Promise<ExportResult> =>
    backup.exportTo(windowFor(event)),
  );

  handle(IPC_CHANNELS.dataImport, (event): Promise<ImportResult> =>
    backup.importFrom(windowFor(event)),
  );

  handle(IPC_CHANNELS.dataOpenFolder, (): Promise<void> => backup.openDataFolder());
}
