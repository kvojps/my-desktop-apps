import { useProductsContext } from '@/contexts/ProductsContext';
import { useProductFilters } from './useProductFilters';

export type { FilterState, SortKey, SortState } from './useProductFilters';

export function useProducts() {
  const context = useProductsContext();
  const filterState = useProductFilters(context.products);

  return { ...context, ...filterState };
}
