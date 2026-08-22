import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronApi } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { ProjectInput } from '@shared/types/project';
import type { ThemeMode } from '@shared/types/theme';

const INITIAL_THEME_MODE_FLAG = '--initial-theme-mode=';

/**
 * O modo que o main já resolveu (banco ou sistema operacional) e passou por
 * `webPreferences.additionalArguments`. Chega aqui de forma síncrona, antes do
 * primeiro render, que é o que evita o frame de tema errado no boot.
 */
function readInitialThemeMode(): ThemeMode | null {
  const arg = process.argv.find((value) => value.startsWith(INITIAL_THEME_MODE_FLAG));
  const mode = arg?.slice(INITIAL_THEME_MODE_FLAG.length);
  return mode === 'light' || mode === 'dark' ? mode : null;
}

const api: ElectronApi = {
  onDataChanged: (listener) => {
    const handler = () => listener();
    ipcRenderer.on(IPC_CHANNELS.dataChanged, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.dataChanged, handler);
  },
  projects: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.projectsList),
    create: (data: ProjectInput) => ipcRenderer.invoke(IPC_CHANNELS.projectsCreate, data),
    update: (id: string, data: ProjectInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.projectsUpdate, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.projectsDelete, id),
  },
  data: {
    openFolder: () => ipcRenderer.invoke(IPC_CHANNELS.dataOpenFolder),
  },
  theme: {
    initialMode: readInitialThemeMode(),
    set: (mode: ThemeMode) => ipcRenderer.invoke(IPC_CHANNELS.themeSet, mode),
  },
};

contextBridge.exposeInMainWorld('api', api);
