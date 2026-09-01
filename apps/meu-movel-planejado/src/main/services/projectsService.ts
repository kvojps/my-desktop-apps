import type { CuttingParamsInput, ProjectInput } from '@shared/types/project';
import type { ProjectEntity } from '../domain/project';
import type { Repositories } from '../infra/database';
import { AppError } from '../utils/errors/AppError';

const PROJECT_GONE = 'Este projeto não existe mais.';

/**
 * CRUD de projeto. A regra que sobra depois de os repositórios pararem de lançar
 * (ticket 03) é a tradução do `null`/`false` de volta para `AppError(404)` — e a
 * escolha, em `get`, de **não** traduzir: projeto inexistente ali é uma tela com
 * saída de volta para a lista, não erro.
 */
export function makeProjectsService(repos: Repositories) {
  return {
    list(): ProjectEntity[] {
      return repos.projects.list();
    },

    /**
     * `null`, e não 404: quem chama precisa distinguir "este projeto não existe
     * mais" (uma tela com saída de volta) de "o banco falhou" (um erro). Era o
     * comentário de `projectsRepository.getProjectOrThrow`, preservado.
     */
    get(id: string): ProjectEntity | null {
      return repos.projects.findById(id);
    },

    /** O repositório aplica `DEFAULT_KERF_TENTHS_MM`/`DEFAULT_TRIM_TENTHS_MM`. */
    create(data: ProjectInput): ProjectEntity {
      return repos.projects.create(data);
    },

    update(id: string, data: ProjectInput): ProjectEntity {
      const updated = repos.projects.update(id, data);
      if (!updated) throw new AppError(404, PROJECT_GONE);
      return updated;
    },

    updateCuttingParams(id: string, data: CuttingParamsInput): ProjectEntity {
      const updated = repos.projects.updateCuttingParams(id, data);
      if (!updated) throw new AppError(404, PROJECT_GONE);
      return updated;
    },

    /**
     * `false` do repo vira `AppError(404)`, e continua lançando como hoje: a
     * lista da tela pode estar velha, e confirmar "Projeto excluído" sobre nada
     * diria que o app fez algo que não fez.
     */
    delete(id: string): void {
      if (!repos.projects.delete(id)) throw new AppError(404, PROJECT_GONE);
    },
  };
}

export type ProjectsService = ReturnType<typeof makeProjectsService>;
