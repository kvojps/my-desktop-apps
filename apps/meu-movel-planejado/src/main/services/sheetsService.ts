import type { SheetInput } from '@shared/types/sheet';
import type { SheetEntity } from '../domain/sheet';
import type { Repositories } from '../infra/database';
import { AppError } from '../utils/errors/AppError';

const PROJECT_GONE = 'Este projeto não existe mais.';
const SHEET_GONE = 'Esta chapa não existe mais.';

/**
 * Chapas de um projeto. Mesma forma do `piecesService`, sem a régua da
 * rejeição: excluir uma chapa pode tornar rejeitada uma peça que foi aceita no
 * cadastro, e é o empacotador que classifica de novo (`@shared/nesting/fit`) —
 * comportamento de hoje, preservado.
 *
 * `create`/`update`/`delete` compõem o `touch` do projeto e a escrita numa
 * `repos.transaction`, pelo mesmo motivo das peças.
 */
export function makeSheetsService(repos: Repositories) {
  return {
    list(projectId: string): SheetEntity[] {
      return repos.sheets.listForProject(projectId);
    },

    create(projectId: string, data: SheetInput): SheetEntity {
      return repos.transaction(() => {
        if (!repos.projects.touch(projectId)) throw new AppError(404, PROJECT_GONE);
        return repos.sheets.create(projectId, data);
      });
    },

    update(id: string, data: SheetInput): SheetEntity {
      const current = repos.sheets.findById(id);
      if (!current) throw new AppError(404, SHEET_GONE);
      return repos.transaction(() => {
        repos.projects.touch(current.projectId);
        const updated = repos.sheets.update(id, data);
        if (!updated) throw new AppError(404, SHEET_GONE);
        return updated;
      });
    },

    delete(id: string): void {
      const current = repos.sheets.findById(id);
      if (!current) throw new AppError(404, SHEET_GONE);
      repos.transaction(() => {
        repos.projects.touch(current.projectId);
        repos.sheets.delete(id);
      });
    },
  };
}

export type SheetsService = ReturnType<typeof makeSheetsService>;
