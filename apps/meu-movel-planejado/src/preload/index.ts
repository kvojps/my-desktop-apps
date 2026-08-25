import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronApi } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { PieceInput } from '@shared/types/piece';
import type { PlanInput } from '@shared/types/plan';
import type { CuttingParamsInput, ProjectInput } from '@shared/types/project';
import type { SheetInput } from '@shared/types/sheet';
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
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.projectsGet, id),
    update: (id: string, data: ProjectInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.projectsUpdate, id, data),
    updateCuttingParams: (id: string, data: CuttingParamsInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.projectsUpdateCuttingParams, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.projectsDelete, id),
  },
  pieces: {
    list: (projectId: string) => ipcRenderer.invoke(IPC_CHANNELS.piecesList, projectId),
    create: (projectId: string, data: PieceInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.piecesCreate, projectId, data),
    update: (id: string, data: PieceInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.piecesUpdate, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.piecesDelete, id),
  },
  sheets: {
    list: (projectId: string) => ipcRenderer.invoke(IPC_CHANNELS.sheetsList, projectId),
    create: (projectId: string, data: SheetInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.sheetsCreate, projectId, data),
    update: (id: string, data: SheetInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.sheetsUpdate, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.sheetsDelete, id),
  },
  plans: {
    get: (projectId: string) => ipcRenderer.invoke(IPC_CHANNELS.plansGet, projectId),
    save: (projectId: string, data: PlanInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.plansSave, projectId, data),
    print: () => ipcRenderer.invoke(IPC_CHANNELS.plansPrint),
    exportPng: (projectId: string, bytes: Uint8Array) =>
      ipcRenderer.invoke(IPC_CHANNELS.plansExportPng, projectId, bytes),
    exportPdf: (projectId: string) => ipcRenderer.invoke(IPC_CHANNELS.plansExportPdf, projectId),
  },
  data: {
    exportAll: () => ipcRenderer.invoke(IPC_CHANNELS.dataExport),
    import: () => ipcRenderer.invoke(IPC_CHANNELS.dataImport),
    appInfo: () => ipcRenderer.invoke(IPC_CHANNELS.dataAppInfo),
    openFolder: () => ipcRenderer.invoke(IPC_CHANNELS.dataOpenFolder),
  },
  theme: {
    initialMode: readInitialThemeMode(),
    set: (mode: ThemeMode) => ipcRenderer.invoke(IPC_CHANNELS.themeSet, mode),
  },
};

contextBridge.exposeInMainWorld('api', api);
