import { getDbPath } from '../../database/connection';

/**
 * O dado de ambiente que a tela de Configurações mostra: o caminho do arquivo
 * do banco em disco. A versão do app não passa por aqui — o renderer a recebe
 * do build, em `__APP_VERSION__`, e por isso a mostra mesmo sem IPC.
 *
 * É gateway porque é "pergunte ao ambiente": o caminho do banco é estado do
 * processo (fixado no `initDb`) que o `settingsService` não alcança sem sair
 * da própria camada. Mesmo motivo do
 * `shell.ts`: perguntar onde fica a pasta de dados é sair do processo tanto
 * quanto abri-la.
 */
export interface AppInfoGateway {
  dbPath(): string;
}

export const appInfo: AppInfoGateway = {
  dbPath: () => getDbPath(),
};
