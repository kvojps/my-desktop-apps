import { useOrdersContext } from '@/contexts/OrdersContext';
import { useOrderFilters } from './useOrderFilters';

export type { OrderFilterState, OrderSortKey, OrderSortState } from './useOrderFilters';

export function useOrders() {
  const context = useOrdersContext();
  const filterState = useOrderFilters(context.orders);

  return { ...context, ...filterState };
}
