import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { Product } from '@shared/types/product';
import type { ProductsService } from '../services/productsService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { productToResponse } from './responses/product.response';
import { createProductSchema, updateProductSchema } from './schemas/products.schema';

/**
 * Os canais do catálogo de produtos. CRUD puro — o `productsService` só decide o
 * `AppError(404)` de "não encontrado" —, e o que sobra aqui são as duas pontas
 * da fronteira: `parseOrThrow` na entrada e `productToResponse` na saída.
 */
export function registerProductsController(products: ProductsService): void {
  handle(IPC_CHANNELS.productsGetAll, (): Product[] => products.list().map(productToResponse));

  handle(IPC_CHANNELS.productsAdd, (_event, data: unknown): Product =>
    productToResponse(products.create(parseOrThrow(createProductSchema, data))),
  );

  handle(IPC_CHANNELS.productsUpdate, (_event, id: unknown, data: unknown): Product =>
    productToResponse(products.update(parseId(id), parseOrThrow(updateProductSchema, data))),
  );

  handle(IPC_CHANNELS.productsDelete, (_event, id: unknown): void => {
    products.delete(parseId(id));
  });
}
