import type { Product } from '@shared/types/product';
import type { ProductEntity } from '../../domain/product';

/**
 * `entity → response` de produto (README §2.5). `ProductEntity` e `Product` são
 * idênticos hoje, e é por isso que a função precisa existir: sem ela a entidade
 * atravessaria o IPC por identidade estrutural, e um campo novo em
 * `ProductEntity` chegaria ao renderer sem que ninguém tivesse decidido que
 * chega.
 */
export function productToResponse(entity: ProductEntity): Product {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    category: entity.category,
    supplier: entity.supplier,
    costPrice: entity.costPrice,
    salePrice: entity.salePrice,
    stock: entity.stock,
    minStock: entity.minStock,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
