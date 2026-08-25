import { IpcRendererEvent, contextBridge, ipcRenderer } from 'electron';
import type { ElectronApi } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { RepoFetchProgress } from '@shared/types/repoScan';
import type { ThemeMode } from '@shared/types/theme';

/**
 * Lido de forma síncrona do argumento de linha de comando que o main passou
 * na construção da janela (`additionalArguments`) — o renderer precisa do
 * modo antes do primeiro render, e uma chamada IPC chegaria tarde
 * (docs/design-system.md §5.1).
 */
function readInitialThemeMode(): ThemeMode {
  const arg = process.argv.find((value) => value.startsWith('--initial-theme-mode='));
  const mode = arg?.split('=')[1];
  return mode === 'dark' ? 'dark' : 'light';
}

const api: ElectronApi = {
  onDataChanged: (listener: () => void) => {
    const handler = () => listener();
    ipcRenderer.on(IPC_CHANNELS.dataChanged, handler);
    return () => {
      ipcRenderer.off(IPC_CHANNELS.dataChanged, handler);
    };
  },
  scanPaths: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.scanPathsGetAll),
    add: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.scanPathsAdd, path),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.scanPathsDelete, id),
  },
  repos: {
    scan: () => ipcRenderer.invoke(IPC_CHANNELS.reposScan),
    fetch: (paths?: string[]) => ipcRenderer.invoke(IPC_CHANNELS.reposFetch, paths ?? null),
    onFetchProgress: (listener: (progress: RepoFetchProgress) => void) => {
      const handler = (_event: IpcRendererEvent, progress: RepoFetchProgress) => listener(progress);
      ipcRenderer.on(IPC_CHANNELS.reposFetchProgress, handler);
      return () => {
        ipcRenderer.off(IPC_CHANNELS.reposFetchProgress, handler);
      };
    },
  },
  prs: {
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.prsGetStatus),
    saveToken: (token: string) => ipcRenderer.invoke(IPC_CHANNELS.prsSaveToken, token),
    deleteToken: () => ipcRenderer.invoke(IPC_CHANNELS.prsDeleteToken),
    redetect: () => ipcRenderer.invoke(IPC_CHANNELS.prsRedetect),
  },
  dialog: {
    selectDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.dialogSelectDirectory),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.shellOpenExternal, url),
  },
  data: {
    openFolder: () => ipcRenderer.invoke(IPC_CHANNELS.dataOpenFolder),
  },
  settings: {
    getInitialThemeMode: readInitialThemeMode,
    saveThemeMode: (mode: ThemeMode) =>
      ipcRenderer.invoke(IPC_CHANNELS.settingsSaveThemeMode, mode),
  },
};

contextBridge.exposeInMainWorld('api', api);
