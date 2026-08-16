import { IpcRendererEvent, contextBridge, ipcRenderer } from 'electron';
import type { ElectronApi } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { RepoFetchProgress } from '@shared/types/repoScan';

const api: ElectronApi = {
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
};

contextBridge.exposeInMainWorld('api', api);
