import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { Product } from '@shared/types/product';
import type { ProductsService } from '../services/productsService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { createProductSchema, updateProductSchema } from './schemas/products.schema';

/**
 * Os canais do catálogo de produtos. CRUD puro — o `productsService` só decide o
 * `AppError(404)` de "não encontrado" —, e o que sobra aqui é a fronteira de
 * entrada: `parseOrThrow`. Sem entidade separada do response, o retorno do
 * service atravessa direto.
 */
export function registerProductsController(products: ProductsService): void {
  handle(IPC_CHANNELS.productsGetAll, (): Product[] => products.list());

  handle(IPC_CHANNELS.productsAdd, (_event, data: unknown): Product =>
    products.create(parseOrThrow(createProductSchema, data)),
  );

  handle(IPC_CHANNELS.productsUpdate, (_event, id: unknown, data: unknown): Product =>
    products.update(parseId(id), parseOrThrow(updateProductSchema, data)),
  );

  handle(IPC_CHANNELS.productsDelete, (_event, id: unknown): void => {
    products.delete(parseId(id));
  });
}
