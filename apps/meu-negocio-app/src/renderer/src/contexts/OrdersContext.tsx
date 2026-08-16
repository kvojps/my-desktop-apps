import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CreateOrderData, Order, OrderStatus, UpdateOrderData } from '@shared/types/order';
import { call } from '@/api/client';
import { useProductsContext } from './ProductsContext';
import { useToast } from './ToastContext';

export interface OrdersContextValue {
  orders: Order[];
  isLoading: boolean;
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
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    call(() => window.api.orders.getAll())
      .then(setOrders)
      .catch(() => showToast('Erro ao carregar os pedidos.', 'error'))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addOrder(data: CreateOrderData) {
    const order = await call(() => window.api.orders.add(data));
    setOrders((prev) => sortByCreatedAt([...prev, order]));
    return order;
  }

  async function setOrderStatus(id: string, newStatus: OrderStatus) {
    const { order, updatedProducts } = await call(() => window.api.orders.setStatus(id, newStatus));
    setOrders((prev) => prev.map((o) => (o.id === id ? order : o)));
    if (updatedProducts.length > 0) {
      await refreshProducts();
    }
  }

  async function setOrderPaymentAmount(id: string, amountPaid: number) {
    const order = await call(() => window.api.orders.setPaymentAmount(id, amountPaid));
    setOrders((prev) => prev.map((o) => (o.id === id ? order : o)));
  }

  async function updateOrder(id: string, data: UpdateOrderData) {
    const updated = await call(() => window.api.orders.update(id, data));
    setOrders((prev) => sortByCreatedAt(prev.map((o) => (o.id === id ? updated : o))));
  }

  async function deleteOrder(id: string) {
    const { updatedProducts } = await call(() => window.api.orders.delete(id));
    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (updatedProducts.length > 0) {
      await refreshProducts();
    }
  }

  const value = useMemo<OrdersContextValue>(
    () => ({
      orders,
      isLoading,
      addOrder,
      updateOrder,
      setOrderStatus,
      setOrderPaymentAmount,
      deleteOrder,
    }),
    [orders, isLoading],
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
