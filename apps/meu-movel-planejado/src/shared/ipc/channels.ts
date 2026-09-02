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
   * Empacota as peças do projeto nas chapas e grava o plano, substituindo o
   * vigente. O renderer manda só o id — o empacotamento roda no main (ticket
   * 07). Escrita, mas a única que **não** move o carimbo de alteração do
   * projeto: gerar não altera o serviço, e mexer no carimbo faria todo plano
   * nascer desatualizado em relação a si mesmo.
   */
  plansGenerate: 'plans:generate',
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

  /**
   * O backup do app inteiro, num arquivo escolhido no diálogo do sistema.
   * Exportar lê o banco e grava fora dele; importar substitui **todo** o
   * conteúdo do banco pelo do arquivo.
   */
  dataExport: 'data:export',
  dataImport: 'data:import',
  /** Versão do app e caminho do banco em disco. */
  dataAppInfo: 'data:appInfo',
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
  // Exportar o backup é a maior leitura que o app faz — o banco inteiro — e não
  // grava uma linha: o arquivo sai para fora dele. Importar é o contrário, e por
  // isso está de fora desta lista: é a única escrita do app que troca tudo de
  // uma vez, e é o aviso dela que faz toda tela viva largar o dado antigo.
  //
  // A importação cancelada também avisa, porque a classificação é por canal e
  // não por resultado. É exatamente o custo que esta lista assume: uma recarga a
  // mais, nunca um valor velho. Distinguir o cancelamento aqui exigiria que o
  // `handle` inspecionasse o valor de retorno de todo handler — trocar uma
  // consulta desperdiçada em SQLite local por um acoplamento ao formato da
  // resposta é um mau negócio.
  IPC_CHANNELS.dataExport,
  IPC_CHANNELS.dataAppInfo,
  // Abrir a pasta no explorador não toca o banco. Estava fora desta lista desde
  // que o canal nasceu, o que fazia clicar em "Abrir pasta de dados" recarregar
  // a tela inteira por nada — o custo previsto de esquecer de classificar.
  IPC_CHANNELS.dataOpenFolder,
]);

/**
 * Se um canal, ao terminar com sucesso, deve avisar o renderer de que os dados
 * mudaram. Pura de propósito: é o coração do mecanismo de invalidação e
 * precisa ser testável sem Electron.
 */
export function shouldNotifyDataChanged(channel: string): boolean {
  return !READ_ONLY_CHANNELS.has(channel as IpcChannel);
}
