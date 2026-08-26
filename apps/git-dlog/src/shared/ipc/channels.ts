export const IPC_CHANNELS = {
  scanPathsGetAll: 'scanPaths:getAll',
  scanPathsAdd: 'scanPaths:add',
  scanPathsDelete: 'scanPaths:delete',
  reposScan: 'repos:scan',
  reposFetch: 'repos:fetch',
  reposFetchProgress: 'repos:fetchProgress',
  prsGetStatus: 'prs:getStatus',
  prsSaveToken: 'prs:saveToken',
  prsDeleteToken: 'prs:deleteToken',
  prsRedetect: 'prs:redetect',
  dialogSelectDirectory: 'dialog:selectDirectory',
  shellOpenExternal: 'shell:openExternal',
  dataOpenFolder: 'data:openFolder',
  settingsSaveThemeMode: 'settings:saveThemeMode',

  /**
   * Evento (main → renderer), não `invoke`: avisa que algo no banco mudou.
   * É o único canal desta lista que não tem handler do lado do main.
   */
  dataChanged: 'data:changed',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

/**
 * Os canais que não avisam mudança de dado. Todo canal fora desta lista é
 * tratado como escrita e dispara `dataChanged` ao terminar.
 *
 * A lista enumera os inofensivos de propósito: esquecer de classificar um canal
 * novo custa uma recarga a mais, nunca um valor velho na tela. O tipo
 * `IpcChannel` garante que renomear um canal quebre aqui no `tsc`, e não em
 * silêncio no runtime.
 *
 * Quase todos são leituras, mas nem todos — `settingsSaveThemeMode` grava e
 * ainda assim entra, pelo motivo anotado nele. O critério é "nada que a tela
 * mostre como dado ficou velho", não "não tocou o banco".
 */
export const READ_ONLY_CHANNELS: ReadonlySet<IpcChannel> = new Set([
  IPC_CHANNELS.scanPathsGetAll,
  // Varredura local: lê o disco para montar a lista, não grava nada.
  IPC_CHANNELS.reposScan,
  IPC_CHANNELS.prsGetStatus,
  // Diálogo nativo e explorador de arquivos: nem leem nem gravam o banco.
  IPC_CHANNELS.dialogSelectDirectory,
  IPC_CHANNELS.shellOpenExternal,
  IPC_CHANNELS.dataOpenFolder,
  // Grava a preferência de tema, e ainda assim não avisa. A tela já é repintada
  // pelo caminho do próprio tema (o `settingsService` manda o gateway aplicar
  // no main, o provider no renderer), então a recarga aqui seria ruído puro:
  // nenhum dado de domínio muda quando se troca claro por escuro. É a exceção
  // que a regra "escrita é tudo o que sobra" permite pagar — o custo de errar
  // aqui é uma tela sem recarregar dado que não mudou.
  IPC_CHANNELS.settingsSaveThemeMode,
]);

/**
 * Se um canal, ao terminar com sucesso, deve avisar o renderer de que os dados
 * mudaram. Pura de propósito: é o coração do mecanismo de invalidação e
 * precisa ser testável sem Electron.
 */
export function shouldNotifyDataChanged(channel: string): boolean {
  return !READ_ONLY_CHANNELS.has(channel as IpcChannel);
}
