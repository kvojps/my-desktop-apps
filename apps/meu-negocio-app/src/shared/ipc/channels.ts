export const IPC_CHANNELS = {
  productsGetAll: 'products:getAll',
  productsAdd: 'products:add',
  productsUpdate: 'products:update',
  productsDelete: 'products:delete',
  ordersGetAll: 'orders:getAll',
  ordersAdd: 'orders:add',
  ordersUpdate: 'orders:update',
  ordersSetStatus: 'orders:setStatus',
  ordersSetPaymentAmount: 'orders:setPaymentAmount',
  ordersDelete: 'orders:delete',
  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',
  appGetInfo: 'app:getInfo',
  dataExport: 'data:export',
  dataImport: 'data:import',
  dataOpenFolder: 'data:openFolder',
  themeGet: 'theme:get',
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
 * `themeSet` grava, mas entra aqui porque quem repinta a tela é o próprio
 * fluxo de tema — uma recarga atrás dele seria ruído. `dataExport` também
 * entra: não altera nada no banco, só lê e escreve um arquivo fora do app.
 * `dataImport` é o oposto — a escrita mais pesada do app, que apaga e
 * reescreve produtos, pedidos e configurações inteiros — e por isso fica de
 * fora, mesmo perto de `dataExport` no nome.
 *
 * A lista enumera as **leituras** de propósito: esquecer de classificar um
 * canal novo custa uma recarga a mais, nunca um valor velho na tela. O tipo
 * `IpcChannel` garante que renomear um canal quebre aqui no `tsc`, e não em
 * silêncio no runtime.
 */
export const READ_ONLY_CHANNELS: ReadonlySet<IpcChannel> = new Set([
  IPC_CHANNELS.productsGetAll,
  IPC_CHANNELS.ordersGetAll,
  IPC_CHANNELS.settingsGet,
  IPC_CHANNELS.appGetInfo,
  IPC_CHANNELS.dataExport,
  IPC_CHANNELS.dataOpenFolder,
  IPC_CHANNELS.themeGet,
  IPC_CHANNELS.themeSet,
]);

/**
 * Se um canal, ao terminar com sucesso, deve avisar o renderer de que os dados
 * mudaram. Pura de propósito: é o coração do mecanismo de invalidação e
 * precisa ser testável sem Electron.
 */
export function shouldNotifyDataChanged(channel: string): boolean {
  return !READ_ONLY_CHANNELS.has(channel as IpcChannel);
}
