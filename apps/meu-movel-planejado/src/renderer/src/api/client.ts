import type { Project, ProjectInput } from '@shared/types/project';
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
   * Assina o aviso de mudança de dados e devolve a função de cancelamento.
   * Não passa por `call`: não é `invoke` e não produz erro de IPC.
   */
  onDataChanged(listener: () => void) {
    return window.api.onDataChanged(listener);
  },

  getProjects() {
    return call<Project[]>(() => window.api.projects.list());
  },

  createProject(data: ProjectInput) {
    return call<Project>(() => window.api.projects.create(data));
  },

  updateProject(id: string, data: ProjectInput) {
    return call<Project>(() => window.api.projects.update(id, data));
  },

  deleteProject(id: string) {
    return call(() => window.api.projects.delete(id));
  },

  openDataFolder() {
    return call(() => window.api.data.openFolder());
  },

  /**
   * Síncrono de propósito, e por isso fora do `call`: é o modo que o main já
   * resolveu, entregue pelo preload antes do primeiro render.
   */
  initialThemeMode(): ThemeMode | null {
    return window.api.theme.initialMode;
  },

  setThemeMode(mode: ThemeMode) {
    return call(() => window.api.theme.set(mode));
  },
};
