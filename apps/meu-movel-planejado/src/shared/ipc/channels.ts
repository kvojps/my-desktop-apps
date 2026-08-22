export const IPC_CHANNELS = {
  projectsList: 'projects:list',
  projectsGet: 'projects:get',
  projectsCreate: 'projects:create',
  projectsUpdate: 'projects:update',
  /**
   * Kerf e refile, separados do nome e do material: são a geometria do corte, e
   * quem os edita é a tela do projeto, não a lista.
   */
  projectsUpdateCuttingParams: 'projects:updateCuttingParams',
  projectsDelete: 'projects:delete',

  piecesList: 'pieces:list',
  piecesCreate: 'pieces:create',
  piecesUpdate: 'pieces:update',
  piecesDelete: 'pieces:delete',

  sheetsList: 'sheets:list',
  sheetsCreate: 'sheets:create',
  sheetsUpdate: 'sheets:update',
  sheetsDelete: 'sheets:delete',

  dataOpenFolder: 'data:openFolder',

  themeSet: 'theme:set',

  /**
   * Evento (main → renderer), não `invoke`: avisa que algo no banco mudou.
   * É o único canal desta lista que não tem handler do lado do main.
   */
  dataChanged: 'data:changed',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

/**
 * As leituras puras. Todo canal fora desta lista é tratado como escrita e
 * dispara `dataChanged` ao terminar.
 *
 * A lista enumera as **leituras** de propósito: esquecer de classificar um
 * canal novo custa uma recarga a mais, nunca um valor velho na tela. O tipo
 * `IpcChannel` garante que renomear um canal quebre aqui no `tsc`, e não em
 * silêncio no runtime.
 */
export const READ_ONLY_CHANNELS: ReadonlySet<IpcChannel> = new Set([
  IPC_CHANNELS.projectsList,
  IPC_CHANNELS.projectsGet,
  IPC_CHANNELS.piecesList,
  IPC_CHANNELS.sheetsList,
]);

/**
 * Se um canal, ao terminar com sucesso, deve avisar o renderer de que os dados
 * mudaram. Pura de propósito: é o coração do mecanismo de invalidação e
 * precisa ser testável sem Electron.
 */
export function shouldNotifyDataChanged(channel: string): boolean {
  return !READ_ONLY_CHANNELS.has(channel as IpcChannel);
}
