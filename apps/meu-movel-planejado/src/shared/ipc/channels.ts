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

  /**
   * O plano vigente do projeto. Leitura: o plano é snapshot, e abrir a tela
   * não o regenera.
   */
  plansGet: 'plans:get',
  /**
   * Grava o plano que o renderer acabou de empacotar, substituindo o vigente.
   * Escrita, mas a única que **não** move o carimbo de alteração do projeto:
   * gerar não altera o serviço, e mexer no carimbo faria todo plano nascer
   * desatualizado em relação a si mesmo.
   */
  plansSave: 'plans:save',
  /**
   * Manda a janela para a impressora. Não lê nem grava nada — o documento é o
   * que o renderer já tem desenhado —, e por isso ele está na lista de canais
   * que não avisam mudança de dados.
   */
  plansPrint: 'plans:print',
  /**
   * Salva o plano como arquivo, pelo diálogo do sistema. São dois canais, e não
   * um com um formato por argumento, porque o que atravessa o IPC é diferente
   * em cada um: o PNG chega já rasterizado pelo renderer, e o PDF é impresso
   * pelo main a partir da janela que já está aberta. Só o nome sugerido e a
   * gravação são comuns aos dois.
   */
  plansExportPng: 'plans:exportPng',
  plansExportPdf: 'plans:exportPdf',

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
 * Os canais que **não alteram dado nenhum**. Todo canal fora desta lista é
 * tratado como escrita e dispara `dataChanged` ao terminar.
 *
 * A lista enumera os inofensivos de propósito: esquecer de classificar um canal
 * novo custa uma recarga a mais, nunca um valor velho na tela. O tipo
 * `IpcChannel` garante que renomear um canal quebre aqui no `tsc`, e não em
 * silêncio no runtime.
 */
export const READ_ONLY_CHANNELS: ReadonlySet<IpcChannel> = new Set([
  IPC_CHANNELS.projectsList,
  IPC_CHANNELS.projectsGet,
  IPC_CHANNELS.piecesList,
  IPC_CHANNELS.sheetsList,
  IPC_CHANNELS.plansGet,
  // Imprimir não é leitura de dado, mas também não é escrita: avisar aqui
  // recarregaria toda tela viva no instante em que o diálogo de impressão abre,
  // remontando o documento que está sendo impresso.
  IPC_CHANNELS.plansPrint,
  // Exportar lê o projeto e o plano para nomear o arquivo, e não escreve nada
  // no banco. Avisar aqui seria pior do que inútil no PDF: o main imprime o
  // documento que o renderer tem montado, e remontar a tela no instante em que
  // o diálogo abre trocaria o documento debaixo da impressão.
  IPC_CHANNELS.plansExportPng,
  IPC_CHANNELS.plansExportPdf,
]);

/**
 * Se um canal, ao terminar com sucesso, deve avisar o renderer de que os dados
 * mudaram. Pura de propósito: é o coração do mecanismo de invalidação e
 * precisa ser testável sem Electron.
 */
export function shouldNotifyDataChanged(channel: string): boolean {
  return !READ_ONLY_CHANNELS.has(channel as IpcChannel);
}
