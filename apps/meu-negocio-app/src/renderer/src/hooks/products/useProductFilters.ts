import { useMemo, useState } from 'react';
import type { Product } from '@shared/types/product';
import { getProductMargin } from '@shared/types/product';

export type SortKey =
  'name' | 'category' | 'supplier' | 'costPrice' | 'salePrice' | 'margin' | 'stock';

export interface FilterState {
  search: string;
  category: string;
  lowStockOnly: boolean;
}

export interface SortState {
  key: SortKey | null;
  direction: 'asc' | 'desc';
}

export function useProductFilters(products: Product[]) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    lowStockOnly: false,
  });
  const [sort, setSort] = useState<SortState>({
    key: null,
    direction: 'asc',
  });

  const filtered = useMemo(() => {
    let result = [...products];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.supplier.toLowerCase().includes(q),
      );
    }

    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }

    if (filters.lowStockOnly) {
      result = result.filter((p) => p.stock <= p.minStock);
    }

    if (sort.key) {
      const key = sort.key;
      result.sort((a, b) => {
        // Margem é derivada, não é campo do produto.
        if (key === 'margin') {
          const aMargin = getProductMargin(a);
          const bMargin = getProductMargin(b);
          // Sem preço de venda não há margem para comparar: esses produtos vão
          // para o fim nas duas direções, em vez de fingirem margem zero e
          // ocuparem o topo da ordenação crescente.
          if (aMargin === undefined || bMargin === undefined) {
            if (aMargin === bMargin) return 0;
            return aMargin === undefined ? 1 : -1;
          }
          return sort.direction === 'asc' ? aMargin - bMargin : bMargin - aMargin;
        }

        const aVal = a[key];
        const bVal = b[key];

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const cmp = aVal.localeCompare(bVal, 'pt-BR');
          return sort.direction === 'asc' ? cmp : -cmp;
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return result;
  }, [products, filters, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: 'asc' };
    });
  }

  return { filtered, filters, sort, setFilters, toggleSort };
}
