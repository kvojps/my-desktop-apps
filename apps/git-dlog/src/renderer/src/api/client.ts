import type { RepoFetchProgress } from '@shared/types/repoScan';
import type { ThemeMode } from '@shared/types/theme';

function unwrapIpcError(err: unknown): never {
  if (err instanceof Error) {
    const match = err.message.match(
      /Error invoking remote method '[^']+':\s*(?:[A-Za-z]*Error:\s*)?(.*)/s,
    );
    throw new Error(match ? match[1] : err.message);
  }
  throw err;
}

async function call<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    return unwrapIpcError(err);
  }
}

/**
 * Fachada tipada sobre o `window.api` exposto no preload. Toda chamada ao main
 * passa por aqui: é o único lugar que conhece o formato do erro que atravessa o
 * IPC, e o resto do renderer fala com métodos comuns.
 */
export const api = {
  /**
   * Assina o aviso de que o banco mudou. Como o progresso do fetch, é evento e
   * não requisição, então não passa por `call`; devolve o cancelamento.
   */
  onDataChanged(listener: () => void) {
    return window.api.onDataChanged(listener);
  },

  getScanPaths() {
    return call(() => window.api.scanPaths.getAll());
  },

  addScanPath(path: string) {
    return call(() => window.api.scanPaths.add(path));
  },

  deleteScanPath(id: string) {
    return call(() => window.api.scanPaths.delete(id));
  },

  /** Varredura local: rápida, não vai à rede. */
  scanRepos() {
    return call(() => window.api.repos.scan());
  },

  /** `git fetch` nos remotos, consulta de PRs e nova varredura. */
  fetchRepos(paths?: string[]) {
    return call(() => window.api.repos.fetch(paths));
  },

  /**
   * Assina o progresso do fetch. Não atravessa o IPC como requisição, então não
   * passa por `call`; devolve a função de cancelamento.
   */
  onReposFetchProgress(listener: (progress: RepoFetchProgress) => void) {
    return window.api.repos.onFetchProgress(listener);
  },

  getPrStatus() {
    return call(() => window.api.prs.getStatus());
  },

  savePrToken(token: string) {
    return call(() => window.api.prs.saveToken(token));
  },

  deletePrToken() {
    return call(() => window.api.prs.deleteToken());
  },

  redetectPrProviders() {
    return call(() => window.api.prs.redetect());
  },

  selectDirectory() {
    return call(() => window.api.dialog.selectDirectory());
  },

  openExternal(url: string) {
    return call(() => window.api.shell.openExternal(url));
  },

  openDataFolder() {
    return call(() => window.api.data.openFolder());
  },

  getInitialThemeMode() {
    return window.api.settings.getInitialThemeMode();
  },

  saveThemeMode(mode: ThemeMode) {
    return call(() => window.api.settings.saveThemeMode(mode));
  },
};
