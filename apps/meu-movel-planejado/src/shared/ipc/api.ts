import type { Project, ProjectInput } from '@shared/types/project';
import type { ThemeMode } from '@shared/types/theme';

export interface ProjectsApi {
  list: () => Promise<Project[]>;
  create: (data: ProjectInput) => Promise<Project>;
  update: (id: string, data: ProjectInput) => Promise<Project>;
  delete: (id: string) => Promise<void>;
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
  data: DataApi;
  theme: ThemeApi;
}
