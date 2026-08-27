import { app } from 'electron';
import { getDbPath } from '../../database/connection';

/**
 * Os dados de build que a tela de Configurações mostra: a versão do app e o
 * caminho do arquivo do banco em disco.
 *
 * É gateway porque os dois são "pergunte ao ambiente" — a versão sai do
 * Electron, e o caminho do banco é estado do processo (fixado no `initDb`) que o
 * `settingsService` não alcança sem sair da própria camada. Mesmo motivo do
 * `shell.ts`: perguntar onde fica a pasta de dados é sair do processo tanto
 * quanto abri-la.
 */
export interface AppInfoGateway {
  version(): string;
  dbPath(): string;
}

export const appInfo: AppInfoGateway = {
  version: () => app.getVersion(),
  dbPath: () => getDbPath(),
};
