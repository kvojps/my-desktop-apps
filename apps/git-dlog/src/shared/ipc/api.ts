import type { PrIntegrationStatus } from '@shared/types/pullRequest';
import type { RepoFetchProgress, RepoFetchResult, RepoScanResult } from '@shared/types/repoScan';
import type { ScanPath } from '@shared/types/scanPath';
import type { ThemeMode } from '@shared/types/theme';

export interface ScanPathsApi {
  getAll: () => Promise<ScanPath[]>;
  add: (path: string) => Promise<ScanPath>;
  delete: (id: string) => Promise<void>;
}

export interface ReposApi {
  /** Varredura local: rápida, não vai à rede. */
  scan: () => Promise<RepoScanResult[]>;
  /**
   * `git fetch --all --prune` nos repositórios com remoto, consulta de pull
   * requests e, em seguida, uma nova varredura. `paths` restringe a operação a
   * repositórios específicos; omitido, atualiza todos.
   */
  fetch: (paths?: string[]) => Promise<RepoFetchResult>;
  /** Assina o progresso do fetch. Devolve a função de cancelamento. */
  onFetchProgress: (listener: (progress: RepoFetchProgress) => void) => () => void;
}

export interface PrsApi {
  getStatus: () => Promise<PrIntegrationStatus>;
  /** Valida o token, salva cifrado no cofre do sistema e devolve o login dono dele. */
  saveToken: (token: string) => Promise<string>;
  deleteToken: () => Promise<void>;
  /** Refaz a detecção das CLIs (útil depois de instalar o gh). */
  redetect: () => Promise<PrIntegrationStatus>;
}

export interface DialogApi {
  selectDirectory: () => Promise<string | null>;
}

export interface ShellApi {
  /** Abre uma URL http(s) no navegador padrão. */
  openExternal: (url: string) => Promise<void>;
}

export interface DataApi {
  /** Abre a pasta de dados do app no explorador de arquivos. */
  openFolder: () => Promise<void>;
}

export interface SettingsApi {
  /**
   * Modo inicial resolvido pelo processo main antes de criar a janela — lido
   * de forma síncrona (argumento de linha de comando), não por IPC, porque o
   * primeiro render precisa dele (docs/design-system.md §5.1).
   */
  getInitialThemeMode: () => ThemeMode;
  saveThemeMode: (mode: ThemeMode) => Promise<void>;
}

export interface ElectronApi {
  /**
   * Evento main → renderer: o banco mudou. Sem payload — quem guarda dado
   * recarrega o que tem. Devolve a função de cancelamento.
   */
  onDataChanged: (listener: () => void) => () => void;
  scanPaths: ScanPathsApi;
  repos: ReposApi;
  prs: PrsApi;
  dialog: DialogApi;
  shell: ShellApi;
  data: DataApi;
  settings: SettingsApi;
}
