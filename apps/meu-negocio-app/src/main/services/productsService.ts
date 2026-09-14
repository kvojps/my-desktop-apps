import type { Product } from '@shared/types/product';
import type { Repositories } from '../infra/database';
import { AppError } from '../utils/errors/AppError';

/**
 * CRUD de produtos. A única regra é a resposta a "não encontrado": daqui,
 * ausência é `AppError(404)` — inclusive no `delete`, que antes silenciava
 * (decisão 4 da spec), agora igual aos demais verbos.
 */
export function makeProductsService(repos: Repositories) {
  return {
    list(): Product[] {
      return repos.products.list();
    },

    create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
      return repos.products.create(data);
    },

    update(id: string, data: Partial<Product>): Product {
      const product = repos.products.update(id, data);
      if (!product) throw new AppError(404, `Produto não encontrado: ${id}`);
      return product;
    },

    delete(id: string): void {
      const deleted = repos.products.delete(id);
      if (!deleted) throw new AppError(404, `Produto não encontrado: ${id}`);
    },
  };
}

export type ProductsService = ReturnType<typeof makeProductsService>;
