import type { Project } from '@shared/types/project';
import type { ProjectEntity } from '../../domain/project';

/**
 * `entity → response` de Projeto: a segunda travessia do README §2.5, a que o
 * controller faz na saída.
 *
 * `ProjectEntity` e `Project` são idênticas hoje, e é por isso que o mapper
 * precisa existir: sem ele a entidade atravessaria o IPC por identidade
 * estrutural, e um campo novo em `ProjectEntity` chegaria ao renderer sem que
 * ninguém tivesse decidido que chega.
 */
export function projectToResponse(entity: ProjectEntity): Project {
  return {
    id: entity.id,
    name: entity.name,
    material: entity.material,
    kerfTenthsMm: entity.kerfTenthsMm,
    trimTenthsMm: entity.trimTenthsMm,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
