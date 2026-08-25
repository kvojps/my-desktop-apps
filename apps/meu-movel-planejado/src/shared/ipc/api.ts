import type { Piece, PieceInput } from '@shared/types/piece';
import type { Plan, PlanInput } from '@shared/types/plan';
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
   * Grava o plano que o renderer acabou de empacotar, substituindo o vigente.
   * O empacotamento roda lá: é função pura, e o main não empacota.
   */
  save: (projectId: string, data: PlanInput) => Promise<Plan>;
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

export interface DataApi {
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
