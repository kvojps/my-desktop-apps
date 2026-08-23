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
}

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
