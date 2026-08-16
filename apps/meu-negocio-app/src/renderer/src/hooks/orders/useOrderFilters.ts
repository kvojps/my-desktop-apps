import { useMemo, useState } from 'react';
import type { Order } from '@shared/types/order';
import { getOrderPaymentStatus, getOrderTotal } from '@shared/types/order';
import { parseLocalDate } from '@/utils/date';

export type OrderSortKey = 'customerName' | 'status' | 'total' | 'createdAt';

export interface OrderFilterState {
  search: string;
  status: string;
  paymentStatus: string;
  dateFrom: string;
  dateTo: string;
}

export interface OrderSortState {
  key: OrderSortKey | null;
  direction: 'asc' | 'desc';
}

export function useOrderFilters(orders: Order[]) {
  const [filters, setFilters] = useState<OrderFilterState>({
    search: '',
    status: '',
    paymentStatus: '',
    dateFrom: '',
    dateTo: '',
  });
  const [sort, setSort] = useState<OrderSortState>({
    key: null,
    direction: 'asc',
  });

  const filtered = useMemo(() => {
    let result = [...orders];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (o) =>
          o.customerName.toLowerCase().includes(q) ||
          o.items.some((item) => item.productName.toLowerCase().includes(q)),
      );
    }

    if (filters.status) {
      result = result.filter((o) => o.status === filters.status);
    }

    if (filters.paymentStatus) {
      result = result.filter((o) => getOrderPaymentStatus(o) === filters.paymentStatus);
    }

    if (filters.dateFrom) {
      const from = parseLocalDate(filters.dateFrom);
      if (from) {
        result = result.filter((o) => new Date(o.createdAt) >= from);
      }
    }

    if (filters.dateTo) {
      const to = parseLocalDate(filters.dateTo);
      if (to) {
        to.setHours(23, 59, 59, 999);
        result = result.filter((o) => new Date(o.createdAt) <= to);
      }
    }

    if (sort.key) {
      const key = sort.key;
      result.sort((a, b) => {
        let cmp: number;

        if (key === 'total') {
          cmp = getOrderTotal(a) - getOrderTotal(b);
        } else if (key === 'createdAt') {
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else {
          const aVal = a[key] ?? '';
          const bVal = b[key] ?? '';
          cmp = String(aVal).localeCompare(String(bVal), 'pt-BR');
        }

        return sort.direction === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [orders, filters, sort]);

  function toggleSort(key: OrderSortKey) {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: 'asc' };
    });
  }

  return { filtered, filters, sort, setFilters, toggleSort };
}
