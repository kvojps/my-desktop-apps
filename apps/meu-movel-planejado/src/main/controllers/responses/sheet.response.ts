import type { Sheet } from '@shared/types/sheet';
import type { SheetEntity } from '../../domain/sheet';

/**
 * `entity → response` de Chapa (README §2.5, a travessia da saída do controller).
 *
 * `SheetEntity` e `Sheet` são idênticas hoje; o mapper existe pelo mesmo motivo
 * do de Projeto — sem ele um campo novo na entidade vaza para o renderer sem
 * decisão.
 */
export function sheetToResponse(entity: SheetEntity): Sheet {
  return {
    id: entity.id,
    projectId: entity.projectId,
    lengthTenthsMm: entity.lengthTenthsMm,
    widthTenthsMm: entity.widthTenthsMm,
    quantity: entity.quantity,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
