import type { Piece } from '@shared/types/piece';
import type { PieceEntity } from '../../domain/piece';

/**
 * `entity → response` de Peça (README §2.5, a travessia da saída do controller).
 *
 * `PieceEntity` e `Piece` são idênticas hoje; o mapper existe pelo mesmo motivo
 * do de Projeto — sem ele um campo novo na entidade vaza para o renderer sem
 * decisão. `label` já chega aqui como string (vazia quando a tela não
 * preencheu), então não há ausência a tratar.
 */
export function pieceToResponse(entity: PieceEntity): Piece {
  return {
    id: entity.id,
    projectId: entity.projectId,
    label: entity.label,
    lengthTenthsMm: entity.lengthTenthsMm,
    widthTenthsMm: entity.widthTenthsMm,
    quantity: entity.quantity,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
