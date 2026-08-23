import type { Piece, PieceInput } from '@shared/types/piece';
import type { Plan, PlanInput } from '@shared/types/plan';
import type { CuttingParamsInput, Project, ProjectInput } from '@shared/types/project';
import type { Sheet, SheetInput } from '@shared/types/sheet';
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

  getProject(id: string) {
    return call<Project | null>(() => window.api.projects.get(id));
  },

  createProject(data: ProjectInput) {
    return call<Project>(() => window.api.projects.create(data));
  },

  updateProject(id: string, data: ProjectInput) {
    return call<Project>(() => window.api.projects.update(id, data));
  },

  updateCuttingParams(id: string, data: CuttingParamsInput) {
    return call<Project>(() => window.api.projects.updateCuttingParams(id, data));
  },

  deleteProject(id: string) {
    return call(() => window.api.projects.delete(id));
  },

  getPieces(projectId: string) {
    return call<Piece[]>(() => window.api.pieces.list(projectId));
  },

  createPiece(projectId: string, data: PieceInput) {
    return call<Piece>(() => window.api.pieces.create(projectId, data));
  },

  updatePiece(id: string, data: PieceInput) {
    return call<Piece>(() => window.api.pieces.update(id, data));
  },

  deletePiece(id: string) {
    return call(() => window.api.pieces.delete(id));
  },

  getSheets(projectId: string) {
    return call<Sheet[]>(() => window.api.sheets.list(projectId));
  },

  createSheet(projectId: string, data: SheetInput) {
    return call<Sheet>(() => window.api.sheets.create(projectId, data));
  },

  updateSheet(id: string, data: SheetInput) {
    return call<Sheet>(() => window.api.sheets.update(id, data));
  },

  deleteSheet(id: string) {
    return call(() => window.api.sheets.delete(id));
  },

  getPlan(projectId: string) {
    return call<Plan | null>(() => window.api.plans.get(projectId));
  },

  savePlan(projectId: string, data: PlanInput) {
    return call<Plan>(() => window.api.plans.save(projectId, data));
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
