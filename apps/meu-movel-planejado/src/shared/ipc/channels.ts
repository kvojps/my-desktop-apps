export const IPC_CHANNELS = {
  projectsList: 'projects:list',
  projectsCreate: 'projects:create',
  projectsUpdate: 'projects:update',
  projectsDelete: 'projects:delete',

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
export const READ_ONLY_CHANNELS: ReadonlySet<IpcChannel> = new Set([IPC_CHANNELS.projectsList]);

/**
 * Se um canal, ao terminar com sucesso, deve avisar o renderer de que os dados
 * mudaram. Pura de propósito: é o coração do mecanismo de invalidação e
 * precisa ser testável sem Electron.
 */
export function shouldNotifyDataChanged(channel: string): boolean {
  return !READ_ONLY_CHANNELS.has(channel as IpcChannel);
}
