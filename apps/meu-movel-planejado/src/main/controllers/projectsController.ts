import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { Project } from '@shared/types/project';
import type { ProjectsService } from '../services/projectsService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { cuttingParamsInputSchema, projectInputSchema } from './schemas/projects.schema';

/**
 * O CRUD de projeto. O `projectsService` decide os 404 e escolhe, em `get`, não
 * traduzir — aqui ficam as duas pontas da fronteira: `parseOrThrow` / `parseId`
 * na entrada.
 *
 * `projects:get` devolve `null`: projeto inexistente é uma tela com saída de
 * volta para a lista, não um erro.
 */
export function registerProjectsController(projects: ProjectsService): void {
  handle(IPC_CHANNELS.projectsList, (): Project[] => projects.list());

  handle(IPC_CHANNELS.projectsGet, (_event, id: unknown): Project | null =>
    projects.get(parseId(id)),
  );

  handle(IPC_CHANNELS.projectsCreate, (_event, data: unknown): Project =>
    projects.create(parseOrThrow(projectInputSchema, data)),
  );

  handle(IPC_CHANNELS.projectsUpdate, (_event, id: unknown, data: unknown): Project =>
    projects.update(parseId(id), parseOrThrow(projectInputSchema, data)),
  );

  handle(IPC_CHANNELS.projectsUpdateCuttingParams, (_event, id: unknown, data: unknown): Project =>
    projects.updateCuttingParams(parseId(id), parseOrThrow(cuttingParamsInputSchema, data)),
  );

  handle(IPC_CHANNELS.projectsDelete, (_event, id: unknown): void => {
    projects.delete(parseId(id));
  });
}
