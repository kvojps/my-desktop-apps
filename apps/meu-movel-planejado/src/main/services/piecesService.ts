import { PIECE_DOES_NOT_FIT_MESSAGE, fitsAnySheet } from '@shared/nesting/fit';
import type { PieceInput } from '@shared/types/piece';
import type { PieceEntity } from '../domain/piece';
import type { ProjectEntity } from '../domain/project';
import type { Repositories } from '../infra/database';
import { AppError } from '../utils/errors/AppError';

const PROJECT_GONE = 'Este projeto não existe mais.';
const PIECE_GONE = 'Esta peça não existe mais.';

/**
 * Peças de um projeto, com a régua da rejeição e o carimbo do projeto.
 *
 * `create`/`update`/`delete` movem o carimbo de alteração do projeto na **mesma
 * transação** que a escrita da peça: um carimbo antigo com peça nova é
 * exatamente o estado em que o app diria que o plano continua em dia quando ele
 * não está.
 */
export function makePiecesService(repos: Repositories) {
  /**
   * A régua da rejeição, migrada para cá de `piecesRepository`: peça maior que
   * qualquer chapa do projeto é barrada no cadastro, na fronteira de confiança e
   * não só no formulário. É a mesma régua que o empacotador usa
   * (`@shared/nesting/fit`) — duas contas concordando por coincidência
   * divergiriam no dia em que a aritmética do kerf mudasse.
   *
   * Recebe o projeto já carregado: projeto inexistente não é assunto desta régua
   * (é `create` que o traduz em 404, antes da transação — o `findById` que a
   * régua precisaria é o mesmo, decisão 17 da spec).
   */
  function assertFits(project: ProjectEntity, data: PieceInput): void {
    if (fitsAnySheet(data, repos.sheets.listForProject(project.id), project)) return;
    // 422 e não 404: o dado é que não serve, e `classifyError` o traduz em
    // `invalid-input`, o único código cuja mensagem chega inteira à tela.
    throw new AppError(422, PIECE_DOES_NOT_FIT_MESSAGE);
  }

  return {
    list(projectId: string): PieceEntity[] {
      return repos.pieces.listForProject(projectId);
    },

    create(projectId: string, data: PieceInput): PieceEntity {
      // O 404 sai de graça: este `findById` é o mesmo que a régua consome logo
      // abaixo. Hoje esse 404 vinha do `touchProject` dentro da transação.
      const project = repos.projects.findById(projectId);
      if (!project) throw new AppError(404, PROJECT_GONE);
      assertFits(project, data);
      return repos.transaction(() => {
        repos.projects.touch(projectId);
        return repos.pieces.create(projectId, data);
      });
    },

    update(id: string, data: PieceInput): PieceEntity {
      const current = repos.pieces.findById(id);
      if (!current) throw new AppError(404, PIECE_GONE);
      // A FK da peça garante o projeto; se ele sumiu, a régua só não roda —
      // rejeitar aqui seria a régua opinando sobre ausência de projeto, que não
      // é o assunto dela (comportamento do `assertPieceFits` de origem).
      const project = repos.projects.findById(current.projectId);
      if (project) assertFits(project, data);
      return repos.transaction(() => {
        repos.projects.touch(current.projectId);
        const updated = repos.pieces.update(id, data);
        if (!updated) throw new AppError(404, PIECE_GONE);
        return updated;
      });
    },

    delete(id: string): void {
      const current = repos.pieces.findById(id);
      if (!current) throw new AppError(404, PIECE_GONE);
      repos.transaction(() => {
        repos.projects.touch(current.projectId);
        repos.pieces.delete(id);
      });
    },
  };
}

export type PiecesService = ReturnType<typeof makePiecesService>;
