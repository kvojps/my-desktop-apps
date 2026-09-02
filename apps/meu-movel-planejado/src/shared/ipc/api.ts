import type { AppInfo } from '@shared/types/appInfo';
import type { Piece, PieceInput } from '@shared/types/piece';
import type { Plan } from '@shared/types/plan';
import type { CuttingParamsInput, Project, ProjectInput } from '@shared/types/project';
import type { Sheet, SheetInput } from '@shared/types/sheet';
import type { ThemeMode } from '@shared/types/theme';

export interface ProjectsApi {
  list: () => Promise<Project[]>;
  /** Um projeto só, para a tela que o descreve. `null` quando ele não existe mais. */
  get: (id: string) => Promise<Project | null>;
  create: (data: ProjectInput) => Promise<Project>;
  update: (id: string, data: ProjectInput) => Promise<Project>;
  updateCuttingParams: (id: string, data: CuttingParamsInput) => Promise<Project>;
  delete: (id: string) => Promise<void>;
}

export interface PiecesApi {
  list: (projectId: string) => Promise<Piece[]>;
  create: (projectId: string, data: PieceInput) => Promise<Piece>;
  update: (id: string, data: PieceInput) => Promise<Piece>;
  delete: (id: string) => Promise<void>;
}

export interface SheetsApi {
  list: (projectId: string) => Promise<Sheet[]>;
  create: (projectId: string, data: SheetInput) => Promise<Sheet>;
  update: (id: string, data: SheetInput) => Promise<Sheet>;
  delete: (id: string) => Promise<void>;
}

export interface PlansApi {
  /** O plano vigente do projeto. `null` enquanto ninguém mandou gerar. */
  get: (projectId: string) => Promise<Plan | null>;
  /**
   * Gera o plano do projeto: o main empacota as peças nas chapas, grava o
   * resultado substituindo o vigente e o devolve. O renderer manda só o id.
   */
  generate: (projectId: string) => Promise<Plan>;
  /**
   * Manda o plano à impressora, pelo diálogo do sistema. Resolve com `false`
   * quando o usuário cancela: cancelar é resposta, não falha.
   *
   * Não leva o plano como argumento porque não é o main que o desenha — o que
   * vai para o papel é o documento que o renderer já tem montado, revelado pelo
   * `@media print`.
   */
  print: () => Promise<boolean>;
  /**
   * Salva o plano como imagem. Os bytes vêm daqui porque quem rasteriza é o
   * renderer — o desenho é dele —, e quem grava é o main, que é onde mora o
   * diálogo de salvar e o sistema de arquivos.
   */
  exportPng: (projectId: string, bytes: Uint8Array) => Promise<ExportResult>;
  /**
   * Salva o plano como PDF, com o mesmo layout da impressão: o main imprime
   * para arquivo o documento que o renderer já tem montado, em vez de redesenhar
   * o plano do outro lado.
   */
  exportPdf: (projectId: string) => Promise<ExportResult>;
}

/**
 * O resultado de uma exportação. Cancelar o diálogo é **resultado**, e não
 * exceção: quem fechou o diálogo foi o usuário, e obrigar a tela a distinguir
 * desistência de falha dentro de um `catch` faria toda tela decidir de novo o
 * que já se sabe aqui.
 */
export type ExportResult =
  { success: true; filePath: string } | { success: false; error: 'canceled' };

/**
 * O resultado de uma importação. Só há um desfecho que não é sucesso e também
 * não é falha — o usuário ter fechado o diálogo. Arquivo ilegível e arquivo que
 * não é um backup deste app **são** falhas, e sobem como exceção classificada:
 * cada um tem uma mensagem própria, e a tela as exibe sem ter de escolher qual.
 */
export type ImportResult = { success: true } | { success: false; error: 'canceled' };

export interface DataApi {
  /**
   * Grava o banco inteiro num arquivo, escolhido no diálogo do sistema. É o
   * backup: o que resta ao usuário se o computador se perder.
   */
  exportAll: () => Promise<ExportResult>;
  /**
   * Restaura um arquivo exportado, **substituindo** tudo que existe hoje. A
   * confirmação é da tela; aqui já é a operação.
   */
  import: () => Promise<ImportResult>;
  /** Versão do app e caminho do banco em disco. */
  appInfo: () => Promise<AppInfo>;
  /** Abre a pasta de dados do app no explorador de arquivos. */
  openFolder: () => Promise<void>;
}

export interface ThemeApi {
  /**
   * Modo já resolvido pelo processo main antes de a janela existir, entregue de
   * forma síncrona por argumento de linha de comando — o primeiro render precisa
   * dele, e uma chamada de IPC chegaria tarde (docs/design-system.md §5.1).
   */
  initialMode: ThemeMode | null;
  set: (mode: ThemeMode) => Promise<void>;
}

export interface ElectronApi {
  /** Assina o aviso de que o banco mudou; devolve a função de cancelamento. */
  onDataChanged: (listener: () => void) => () => void;
  projects: ProjectsApi;
  pieces: PiecesApi;
  sheets: SheetsApi;
  plans: PlansApi;
  data: DataApi;
  theme: ThemeApi;
}
