import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CreateOrderData, Order, OrderStatus, UpdateOrderData } from '@shared/types/order';
import { api } from '@/api/client';
import { useDataChanged } from '@/hooks/useDataChanged';
import { useProductsContext } from './ProductsContext';
import { useSnackbar } from './SnackbarContext';

export interface OrdersContextValue {
  orders: Order[];
  isLoading: boolean;
  error: unknown;
  retry: () => void;
  addOrder: (data: CreateOrderData) => Promise<Order>;
  updateOrder: (id: string, data: UpdateOrderData) => Promise<void>;
  setOrderStatus: (id: string, newStatus: OrderStatus) => Promise<void>;
  setOrderPaymentAmount: (id: string, amountPaid: number) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

/**
 * Mantém a lista na mesma ordem em que o banco a devolve. Com data de venda
 * retroativa, um pedido recém-criado pode pertencer ao meio da lista, e não ao
 * fim — sem isso a ordem mudaria ao recarregar o app.
 */
function sortByCreatedAt(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { refreshProducts } = useProductsContext();
  const { showSnackbar } = useSnackbar();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  function reload() {
    api
      .getOrders()
      .then((all) => {
        setOrders(all);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        showSnackbar('Erro ao carregar os pedidos.', 'error');
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useDataChanged(reload);

  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addOrder(data: CreateOrderData) {
    const order = await api.addOrder(data);
    setOrders((prev) => sortByCreatedAt([...prev, order]));
    return order;
  }

  async function setOrderStatus(id: string, newStatus: OrderStatus) {
    const { order, updatedProducts } = await api.setOrderStatus(id, newStatus);
    setOrders((prev) => prev.map((o) => (o.id === id ? order : o)));
    if (updatedProducts.length > 0) {
      await refreshProducts();
    }
  }

  async function setOrderPaymentAmount(id: string, amountPaid: number) {
    const order = await api.setOrderPaymentAmount(id, amountPaid);
    setOrders((prev) => prev.map((o) => (o.id === id ? order : o)));
  }

  async function updateOrder(id: string, data: UpdateOrderData) {
    const updated = await api.updateOrder(id, data);
    setOrders((prev) => sortByCreatedAt(prev.map((o) => (o.id === id ? updated : o))));
  }

  async function deleteOrder(id: string) {
    const { updatedProducts } = await api.deleteOrder(id);
    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (updatedProducts.length > 0) {
      await refreshProducts();
    }
  }

  const value = useMemo<OrdersContextValue>(
    () => ({
      orders,
      isLoading,
      error,
      retry,
      addOrder,
      updateOrder,
      setOrderStatus,
      setOrderPaymentAmount,
      deleteOrder,
    }),
    [orders, isLoading, error, retry],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrdersContext(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error('useOrdersContext must be used within an OrdersProvider');
  }
  return ctx;
}
