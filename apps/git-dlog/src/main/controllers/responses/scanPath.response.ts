import type { ScanPath } from '@shared/types/scanPath';
import type { ScanPathEntity } from '../../domain/scanPath';

/**
 * A segunda travessia do README §2.5: a entidade que o service devolve vira o
 * tipo de `@shared` que o renderer recebe.
 *
 * As duas formas são idênticas hoje, e é exatamente por isso que a função
 * precisa existir: sem ela a entidade atravessaria o IPC por identidade
 * estrutural, e um campo novo em `ScanPathEntity` chegaria ao renderer sem que
 * ninguém tivesse decidido que chega.
 */
export function scanPathToResponse(entity: ScanPathEntity): ScanPath {
  return {
    id: entity.id,
    path: entity.path,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
