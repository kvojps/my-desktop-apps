import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { Project } from '@shared/types/project';
import type { ProjectsService } from '../services/projectsService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { projectToResponse } from './responses/project.response';
import { cuttingParamsInputSchema, projectInputSchema } from './schemas/projects.schema';

/**
 * O CRUD de projeto. O `projectsService` decide os 404 e escolhe, em `get`, não
 * traduzir — aqui ficam as duas pontas da fronteira: `parseOrThrow` / `parseId`
 * na entrada e `projectToResponse` na saída.
 *
 * `projects:get` devolve `null` sem mapear: projeto inexistente é uma tela com
 * saída de volta para a lista, não um erro, e `null` não é entidade.
 */
export function registerProjectsController(projects: ProjectsService): void {
  handle(IPC_CHANNELS.projectsList, (): Project[] => projects.list().map(projectToResponse));

  handle(IPC_CHANNELS.projectsGet, (_event, id: unknown): Project | null => {
    const project = projects.get(parseId(id));
    return project === null ? null : projectToResponse(project);
  });

  handle(IPC_CHANNELS.projectsCreate, (_event, data: unknown): Project =>
    projectToResponse(projects.create(parseOrThrow(projectInputSchema, data))),
  );

  handle(IPC_CHANNELS.projectsUpdate, (_event, id: unknown, data: unknown): Project =>
    projectToResponse(projects.update(parseId(id), parseOrThrow(projectInputSchema, data))),
  );

  handle(
    IPC_CHANNELS.projectsUpdateCuttingParams,
    (_event, id: unknown, data: unknown): Project =>
      projectToResponse(
        projects.updateCuttingParams(parseId(id), parseOrThrow(cuttingParamsInputSchema, data)),
      ),
  );

  handle(IPC_CHANNELS.projectsDelete, (_event, id: unknown): void => {
    projects.delete(parseId(id));
  });
}
