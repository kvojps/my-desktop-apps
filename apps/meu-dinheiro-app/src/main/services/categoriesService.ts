import type { CategoryEntity } from '../domain/category';
import type { Repositories } from '../infra/database';
import { AppError } from '../utils/errors/AppError';

/**
 * As Categorias que classificam despesas para o Histórico. Excluir uma deixa as
 * despesas e as Despesas padrão "sem categoria" — nunca as apaga —, tudo numa
 * transação composta aqui (spec desta pasta, decisão 7).
 */
export function makeCategoriesService(repos: Repositories) {
  return {
    list(): CategoryEntity[] {
      return repos.categories.list();
    },

    create(data: { name: string; color: string }): CategoryEntity {
      return repos.categories.create(data);
    },

    update(id: number, data: { name?: string; color?: string }): CategoryEntity {
      const updated = repos.categories.update(id, data);
      if (!updated) throw new AppError(404, 'Categoria não encontrada');
      return updated;
    },

    delete(id: number): void {
      const existing = repos.categories.findById(id);
      if (!existing) throw new AppError(404, 'Categoria não encontrada');

      repos.transaction(() => {
        repos.expenses.clearCategory(id);
        repos.defaultExpenses.clearCategory(id);
        repos.categories.delete(id);
      });
    },
  };
}

export type CategoriesService = ReturnType<typeof makeCategoriesService>;
