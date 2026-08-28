import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { Category } from '@shared/types/category';
import type { CategoriesService } from '../services/categoriesService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { categoryToResponse } from './responses/category.response';
import { createCategorySchema, updateCategorySchema } from './schemas/categories.schema';

/**
 * As Categorias que classificam Despesas para o Histórico. Excluir uma deixa as
 * Despesas "sem categoria" numa transação composta pelo `categoriesService`;
 * aqui ficam `parseOrThrow` / `parseId` na entrada e `categoryToResponse` na
 * saída.
 */
export function registerCategoriesController(categories: CategoriesService): void {
  handle(IPC_CHANNELS.categoriesList, (): Category[] => categories.list().map(categoryToResponse));

  handle(IPC_CHANNELS.categoriesCreate, (_event, data: unknown): Category =>
    categoryToResponse(categories.create(parseOrThrow(createCategorySchema, data))),
  );

  handle(IPC_CHANNELS.categoriesUpdate, (_event, id: unknown, data: unknown): Category =>
    categoryToResponse(categories.update(parseId(id), parseOrThrow(updateCategorySchema, data))),
  );

  handle(IPC_CHANNELS.categoriesDelete, (_event, id: unknown): { message: string } => {
    categories.delete(parseId(id));
    return { message: 'Category deleted' };
  });
}
