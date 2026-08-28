import type { Category, CategoryTotal } from '@shared/types/category';
import type { CategoryEntity, CategoryTotalEntity } from '../../domain/category';

/**
 * `entity → response` de Categoria e da linha do relatório de Histórico
 * (README §2.5). Os dois nós são objeto e ganham mapper próprio; nenhum campo
 * atravessa só porque já estava pronto.
 */
export function categoryToResponse(entity: CategoryEntity): Category {
  return {
    id: entity.id,
    name: entity.name,
    color: entity.color,
    createdAt: entity.createdAt,
  };
}

export function categoryTotalToResponse(entity: CategoryTotalEntity): CategoryTotal {
  return {
    categoryId: entity.categoryId,
    name: entity.name,
    color: entity.color,
    total: entity.total,
    count: entity.count,
  };
}
