import type { PrIntegrationStatus } from '@shared/types/pullRequest';
import type { RepoFetchProgress, RepoFetchResult, RepoScanResult } from '@shared/types/repoScan';
import type { ScanPath } from '@shared/types/scanPath';

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

export interface ElectronApi {
  scanPaths: ScanPathsApi;
  repos: ReposApi;
  prs: PrsApi;
  dialog: DialogApi;
  shell: ShellApi;
  data: DataApi;
}
